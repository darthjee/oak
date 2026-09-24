<?php

namespace Oak\Proxy;

use Tent\RequestHandlers\RequestHandler;
use Tent\Models\RequestInterface;
use Tent\Models\Response;
use Tent\Http\HttpClientInterface;
use Tent\Http\CurlHttpClient;

/**
 * Handles the multipart/form-data "Submit" step of the photo upload flow.
 *
 * Matches `POST /uploads/categories/:category_slug/items/:item_id/photos/:id/submit`
 * (see `docker_volumes/proxy_configuration/rules/uploads.php`) and, per
 * `docs/agents/photo_upload/contracts.md` ("Submit") and `proxy-and-auth.md`:
 *
 * 1. Validates the uploaded file's extension and size before doing anything else.
 * 2. Calls the backend's status-gate endpoint with `{ status: "uploading" }`
 *    (forwarding the incoming `Cookie` header) — the pre-write authorization gate
 *    (delegated to `PhotoSubmitBackendGateway`).
 *    On a non-2xx response, the backend's status/body is relayed as-is and nothing
 *    is written to disk.
 * 3. Writes three files under `storageRoot`, using the `file_path` returned by
 *    the gate call (delegated to `PhotoVersionStorer`):
 *    - `origin/<file_path>`: the uploaded bytes, as is;
 *    - `photos/<file_path>`: a copy that fits within 800x1064;
 *    - `snaps/<file_path>`: a copy that fits within 215x215.
 *    Resizing is done by `PhotoImageResizer` (shrink only, aspect ratio kept,
 *    EXIF orientation applied). Every destination goes through `PhotoPathGuard`
 *    with its prefix folder as the root. If any write or resize fails, every
 *    file already written for this upload (origin included) is removed, the
 *    failure is logged with the photo id and `file_path`, finalize is not
 *    called and `502` is returned.
 * 4. Calls the same endpoint again with `{ status: "ready" }` (Finalize), only
 *    after all three files are on disk (delegated to `PhotoSubmitBackendGateway`).
 * 5. Responds `200` to the frontend.
 */
class PhotoSubmitRequestHandler extends RequestHandler
{
    use PhotoRequestHandlerHelpers;

    /**
     * Matches `/uploads/categories/:category_slug/items/:item_id/photos/:id/submit`.
     */
    private const PATH_PATTERN =
        '#^/uploads/categories/(?<category_slug>[^/]+)/items/(?<item_id>\d+)/photos/(?<id>\d+)/submit/?$#';

    /**
     * Default allow-list of accepted file extensions — mirrors
     * `CreateItemPhotosJob`'s `%w[jpg jpeg png]`.
     */
    private const DEFAULT_ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png'];

    /** @var int Maximum accepted upload size in bytes (0/negative disables the check). */
    private int $maxUploadSizeBytes;

    /** @var string[] Lower-cased allow-list of accepted file extensions. */
    private array $allowedExtensions;

    /** @var PhotoSubmitBackendGateway Makes the outbound status-gate/Finalize calls. */
    private PhotoSubmitBackendGateway $gateway;

    /** @var PhotoVersionStorer Writes the `origin/`, `photos/` and `snaps/` files. */
    private PhotoVersionStorer $storer;

    /**
     * @param string                   $host               Backend base URL.
     * @param string                   $storageRoot        Root holding origin/, photos/ and snaps/.
     * @param integer                  $maxUploadSizeBytes Maximum accepted upload size in bytes.
     * @param array                    $allowedExtensions  Allowed file extensions.
     * @param HttpClientInterface|null $httpClient          Optional HTTP client (defaults to CurlHttpClient).
     */
    public function __construct(
        string $host,
        string $storageRoot,
        int $maxUploadSizeBytes,
        array $allowedExtensions = self::DEFAULT_ALLOWED_EXTENSIONS,
        ?HttpClientInterface $httpClient = null
    ) {
        $this->maxUploadSizeBytes = $maxUploadSizeBytes;
        $this->allowedExtensions = array_map('strtolower', $allowedExtensions);
        $this->gateway = new PhotoSubmitBackendGateway($host, $httpClient ?? new CurlHttpClient());
        $this->storer = new PhotoVersionStorer($storageRoot, new PhotoPathGuard(), new PhotoImageResizer());
    }

    /**
     * Builds a PhotoSubmitRequestHandler using named parameters.
     *
     * Example:
     *   PhotoSubmitRequestHandler::build([
     *     'host' => 'http://backend:3000',
     *     'storageRoot' => '/tmp/photos',
     *     'maxUploadSizeBytes' => 5242880
     *   ])
     *
     * @param array $params Associative array with keys 'host', 'storageRoot',
     *   'maxUploadSizeBytes' and, optionally, 'allowedExtensions'.
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            $params['host'] ?? '',
            $params['storageRoot'] ?? '/tmp/photos',
            (int) ($params['maxUploadSizeBytes'] ?? 0),
            $params['allowedExtensions'] ?? self::DEFAULT_ALLOWED_EXTENSIONS
        );
    }

    /**
     * Drives the Submit flow described in the class docblock.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        $segments = $this->parsePath($request->requestPath());

        if ($segments === null) {
            return $this->errorResponse(404, 'Not Found');
        }

        $file = $request->uploadedFiles()['file'] ?? null;

        $uploadError = $this->validateUpload($file);

        if ($uploadError !== null) {
            return $uploadError;
        }

        $cookie = $this->headerValue($request, 'Cookie');

        $gateResponse = $this->gateway->markUploading($segments, $cookie);

        if ($gateResponse->isSuccessful() === FALSE) {
            return $gateResponse;
        }

        $filePath = $this->extractFilePath($gateResponse->body());

        if ($filePath === null) {
            return $this->errorResponse(502, 'Invalid response from backend');
        }

        $storeError = $this->storer->store($file['tmp_name'], $filePath, $segments['id']);

        if ($storeError !== null) {
            return $this->errorResponse(502, $storeError);
        }

        $finalizeResponse = $this->gateway->markReady($segments, $cookie);

        if ($finalizeResponse->isSuccessful() === FALSE) {
            return $finalizeResponse;
        }

        return new Response([
            'body' => '',
            'httpCode' => 200,
            'headers' => [],
            'request' => $request
        ]);
    }

    /**
     * Validates the uploaded file: presence/upload error, extension, then size.
     *
     * @param array|false|null $file The `'file'` entry from `$request->uploadedFiles()`.
     * @return Response|null The appropriate error Response on the first failing
     *   check, or null when the file passes every check.
     */
    private function validateUpload($file): ?Response
    {
        if ($file === FALSE || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return $this->errorResponse(400, 'Missing or invalid file upload');
        }

        if ($this->hasAllowedExtension($file['name'] ?? '') === FALSE) {
            return $this->errorResponse(415, 'Unsupported file extension');
        }

        if ($this->maxUploadSizeBytes > 0 && ($file['size'] ?? 0) > $this->maxUploadSizeBytes) {
            return $this->errorResponse(413, 'File exceeds maximum allowed size');
        }

        return null;
    }

    /**
     * Extracts the `category_slug`/`item_id`/`id` path segments from the request path.
     *
     * @param string $path The incoming request path.
     * @return array{category_slug: string, item_id: string, id: string}|null
     */
    private function parsePath(string $path): ?array
    {
        if (preg_match(self::PATH_PATTERN, $path, $matches) !== 1) {
            return null;
        }

        return [
            'category_slug' => $matches['category_slug'],
            'item_id' => $matches['item_id'],
            'id' => $matches['id']
        ];
    }

    /**
     * Checks the uploaded file's extension against the allow-list.
     *
     * @param string $fileName The uploaded file's original name.
     * @return boolean
     */
    private function hasAllowedExtension(string $fileName): bool
    {
        $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));

        return in_array($extension, $this->allowedExtensions, true);
    }
}

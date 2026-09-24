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
 *    (forwarding the incoming `Cookie` header) — the pre-write authorization gate.
 *    On a non-2xx response, the backend's status/body is relayed as-is and nothing
 *    is written to disk.
 * 3. Writes three files under `storageRoot`, using the `file_path` returned by
 *    the gate call:
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
 *    after all three files are on disk.
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

    /** Folder, under storageRoot, holding the uploaded original. */
    private const ORIGIN_PREFIX = 'origin';

    /**
     * Resized versions: folder under storageRoot => [max width, max height].
     * Mirrors `prod_public_files/convert.sh` (`-resize 800x1064>` / `215x215>`).
     */
    private const VERSIONS = [
        'photos' => [800, 1064],
        'snaps' => [215, 215]
    ];

    /** @var string Backend base URL (e.g. 'http://backend:3000'). */
    private string $host;

    /** @var string Local filesystem root holding the `origin/`, `photos/` and `snaps/` folders. */
    private string $storageRoot;

    /** @var int Maximum accepted upload size in bytes (0/negative disables the check). */
    private int $maxUploadSizeBytes;

    /** @var string[] Lower-cased allow-list of accepted file extensions. */
    private array $allowedExtensions;

    /** @var HttpClientInterface Client used for the outbound status-gate calls. */
    private HttpClientInterface $httpClient;

    /** @var PhotoPathGuard Guards the write destination against path traversal/escapes. */
    private PhotoPathGuard $pathGuard;

    /** @var PhotoImageResizer Makes the resized `photos/` and `snaps/` versions. */
    private PhotoImageResizer $resizer;

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
        $this->host = rtrim($host, '/');
        $this->storageRoot = rtrim($storageRoot, '/');
        $this->maxUploadSizeBytes = $maxUploadSizeBytes;
        $this->allowedExtensions = array_map('strtolower', $allowedExtensions);
        $this->httpClient = $httpClient ?? new CurlHttpClient();
        $this->pathGuard = new PhotoPathGuard();
        $this->resizer = new PhotoImageResizer();
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
        $gateUrl = $this->gateUrl($segments);

        $gateResponse = $this->callGate($gateUrl, 'uploading', $cookie);

        if ($gateResponse->isSuccessful() === FALSE) {
            return $gateResponse;
        }

        $filePath = $this->extractFilePath($gateResponse->body());

        if ($filePath === null) {
            return $this->errorResponse(502, 'Invalid response from backend');
        }

        $storeError = $this->storeVersions($file['tmp_name'], $filePath, $segments['id']);

        if ($storeError !== null) {
            return $storeError;
        }

        $finalizeResponse = $this->callGate($gateUrl, 'ready', $cookie);

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

    /**
     * Builds the backend's status-gate/Finalize URL for the given path segments.
     *
     * @param array $segments Path segments returned by parsePath().
     * @return string
     */
    private function gateUrl(array $segments): string
    {
        return sprintf(
            '%s/categories/%s/items/%s/photos/%s.json',
            $this->host,
            $segments['category_slug'],
            $segments['item_id'],
            $segments['id']
        );
    }

    /**
     * Calls the backend's status-gate/Finalize endpoint with the given status.
     *
     * @param string      $url    The status-gate/Finalize URL.
     * @param string      $status Either 'uploading' or 'ready'.
     * @param string|null $cookie The incoming request's forwarded Cookie header, if any.
     * @return Response
     */
    private function callGate(string $url, string $status, ?string $cookie): Response
    {
        $headers = ['Content-Type' => 'application/json'];

        if ($cookie !== null) {
            $headers['Cookie'] = $cookie;
        }

        $result = $this->httpClient->request(
            'PATCH',
            $url,
            $headers,
            json_encode(['status' => $status])
        );

        return new Response($result);
    }

    /**
     * Writes `origin/`, `photos/` and `snaps/` for `$filePath`, rolling back
     * every file already written if any step fails.
     *
     * @param string $tmpName  The uploaded file's temporary path.
     * @param string $filePath The destination path, relative to each prefix folder.
     * @param string $photoId  The photo id (for logging).
     * @return Response|null A 502 error Response on failure, null on success.
     */
    private function storeVersions(string $tmpName, string $filePath, string $photoId): ?Response
    {
        $origin = $this->destination(self::ORIGIN_PREFIX, $filePath);

        if ($origin === null || $this->moveUpload($tmpName, $origin) === FALSE) {
            return $this->storeFailure([], $photoId, $filePath, self::ORIGIN_PREFIX, 'Failed to store uploaded file');
        }

        $written = [$origin];

        foreach (self::VERSIONS as $prefix => [$maxWidth, $maxHeight]) {
            $destination = $this->destination($prefix, $filePath);
            $written[] = $destination;
            $resized = $destination !== null
                && $this->resizer->resize($origin, $destination, $maxWidth, $maxHeight);

            if ($resized === FALSE) {
                return $this->storeFailure($written, $photoId, $filePath, $prefix, 'Failed to resize uploaded file');
            }
        }

        return null;
    }

    /**
     * Removes the given files, logs the failure and builds the 502 response.
     *
     * @param array<string|null> $written  Files written (or partly written) for this upload.
     * @param string             $photoId  The photo id.
     * @param string             $filePath The backend-provided file path.
     * @param string             $step     The prefix folder whose write failed.
     * @param string             $message  The error message returned to the client.
     * @return Response
     */
    private function storeFailure(
        array $written,
        string $photoId,
        string $filePath,
        string $step,
        string $message
    ): Response {
        foreach ($written as $path) {
            if ($path !== null && is_file($path) === TRUE) {
                unlink($path);
            }
        }

        error_log(sprintf(
            'PhotoSubmitRequestHandler: failed to write "%s" for photo %s, file_path "%s"; upload rolled back',
            $step,
            $photoId,
            $filePath
        ));

        return $this->errorResponse(502, $message);
    }

    /**
     * Resolves `<storageRoot>/<prefix>/<filePath>`, creating the prefix folder
     * and the file's parent directories as needed.
     *
     * The destination is routed through `PhotoPathGuard` with
     * `<storageRoot>/<prefix>` as the root, so a `..` segment or symlink
     * escape in `filePath` is rejected instead of leaving the prefix folder.
     *
     * @param string $prefix   The prefix folder (origin, photos or snaps).
     * @param string $filePath The destination path, relative to the prefix folder.
     * @return string|null The safe destination path, or null if rejected.
     */
    private function destination(string $prefix, string $filePath): ?string
    {
        $root = $this->storageRoot . '/' . $prefix;
        $dir = dirname($root . '/' . ltrim($filePath, '/'));

        foreach ([$root, $dir] as $path) {
            if (is_dir($path) === FALSE) {
                @mkdir($path, 0775, true);
            }
        }

        return $this->pathGuard->resolve($root, $filePath);
    }

    /**
     * Moves the uploaded file to `$destination`.
     *
     * @param string $tmpName     The uploaded file's temporary path.
     * @param string $destination The safe destination path.
     * @return boolean
     */
    private function moveUpload(string $tmpName, string $destination): bool
    {
        if (is_uploaded_file($tmpName) === TRUE) {
            return move_uploaded_file($tmpName, $destination);
        }

        return @rename($tmpName, $destination);
    }
}

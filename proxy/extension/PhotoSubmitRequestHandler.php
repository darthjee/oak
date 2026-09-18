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
 * 3. Writes the uploaded bytes to `<photosPath>/<file_path>`, using the `file_path`
 *    returned by the gate call.
 * 4. Calls the same endpoint again with `{ status: "ready" }` (Finalize).
 * 5. Responds `200` to the frontend.
 */
class PhotoSubmitRequestHandler extends RequestHandler
{
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

    /** @var string Backend base URL (e.g. 'http://backend:3000'). */
    private string $host;

    /** @var string Local filesystem base path backing `Settings.photos_path`. */
    private string $photosPath;

    /** @var int Maximum accepted upload size in bytes (0/negative disables the check). */
    private int $maxUploadSizeBytes;

    /** @var string[] Lower-cased allow-list of accepted file extensions. */
    private array $allowedExtensions;

    /** @var HttpClientInterface Client used for the outbound status-gate calls. */
    private HttpClientInterface $httpClient;

    /** @var PhotoPathGuard Guards the write destination against path traversal/escapes. */
    private PhotoPathGuard $pathGuard;

    /**
     * @param string                   $host               Backend base URL.
     * @param string                   $photosPath         Local filesystem base path for photos.
     * @param integer                  $maxUploadSizeBytes Maximum accepted upload size in bytes.
     * @param array                    $allowedExtensions  Allowed file extensions.
     * @param HttpClientInterface|null $httpClient          Optional HTTP client (defaults to CurlHttpClient).
     */
    public function __construct(
        string $host,
        string $photosPath,
        int $maxUploadSizeBytes,
        array $allowedExtensions = self::DEFAULT_ALLOWED_EXTENSIONS,
        ?HttpClientInterface $httpClient = null
    ) {
        $this->host = rtrim($host, '/');
        $this->photosPath = rtrim($photosPath, '/');
        $this->maxUploadSizeBytes = $maxUploadSizeBytes;
        $this->allowedExtensions = array_map('strtolower', $allowedExtensions);
        $this->httpClient = $httpClient ?? new CurlHttpClient();
        $this->pathGuard = new PhotoPathGuard();
    }

    /**
     * Builds a PhotoSubmitRequestHandler using named parameters.
     *
     * Example:
     *   PhotoSubmitRequestHandler::build([
     *     'host' => 'http://backend:3000',
     *     'photosPath' => '/tmp/photos',
     *     'maxUploadSizeBytes' => 5242880
     *   ])
     *
     * @param array $params Associative array with keys 'host', 'photosPath',
     *   'maxUploadSizeBytes' and, optionally, 'allowedExtensions'.
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            $params['host'] ?? '',
            $params['photosPath'] ?? '/tmp/photos',
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

        if (!$file || ($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
            return $this->errorResponse(400, 'Missing or invalid file upload');
        }

        if (!$this->hasAllowedExtension($file['name'] ?? '')) {
            return $this->errorResponse(415, 'Unsupported file extension');
        }

        if ($this->maxUploadSizeBytes > 0 && ($file['size'] ?? 0) > $this->maxUploadSizeBytes) {
            return $this->errorResponse(413, 'File exceeds maximum allowed size');
        }

        $cookie = $this->headerValue($request, 'Cookie');
        $gateUrl = $this->gateUrl($segments);

        $gateResponse = $this->callGate($gateUrl, 'uploading', $cookie);

        if (!$gateResponse->isSuccessful()) {
            return $gateResponse;
        }

        $filePath = $this->extractFilePath($gateResponse->body());

        if ($filePath === null) {
            return $this->errorResponse(502, 'Invalid response from backend');
        }

        if (!$this->writeFile($file['tmp_name'], $filePath)) {
            return $this->errorResponse(502, 'Failed to store uploaded file');
        }

        $finalizeResponse = $this->callGate($gateUrl, 'ready', $cookie);

        if (!$finalizeResponse->isSuccessful()) {
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
     * Case-insensitively looks up a header value from the request.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @param string           $name    The header name to look up.
     * @return string|null
     */
    private function headerValue(RequestInterface $request, string $name): ?string
    {
        foreach ($request->headers() as $key => $value) {
            if (strcasecmp((string) $key, $name) === 0) {
                return $value;
            }
        }

        return null;
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
     * Extracts the `file_path` from the gate call's JSON response body.
     *
     * @param string $body The gate call's response body.
     * @return string|null
     */
    private function extractFilePath(string $body): ?string
    {
        $decoded = json_decode($body, true);

        if (!is_array($decoded) || !isset($decoded['file_path']) || !is_string($decoded['file_path'])) {
            return null;
        }

        return $decoded['file_path'];
    }

    /**
     * Writes the uploaded file to `<photosPath>/<filePath>`, creating any
     * intermediate directories as needed.
     *
     * The resolved destination is routed through `PhotoPathGuard` after the
     * directory is created, so a `..` segment or symlink escape in
     * `filePath` is rejected instead of writing outside `photosPath`.
     *
     * @param string $tmpName  The uploaded file's temporary path.
     * @param string $filePath The destination path, relative to photosPath.
     * @return boolean True on success, false if the write was rejected/failed.
     */
    private function writeFile(string $tmpName, string $filePath): bool
    {
        $destination = $this->photosPath . '/' . ltrim($filePath, '/');
        $dir = dirname($destination);

        if (!is_dir($dir)) {
            mkdir($dir, 0775, true);
        }

        $safeDestination = $this->pathGuard->resolve($this->photosPath, $filePath);

        if ($safeDestination === null) {
            return false;
        }

        if (is_uploaded_file($tmpName)) {
            return move_uploaded_file($tmpName, $safeDestination);
        }

        return rename($tmpName, $safeDestination);
    }

    /**
     * Builds a JSON error Response.
     *
     * @param integer $httpCode The HTTP status code to respond with.
     * @param string  $message  A short, human-readable error message.
     * @return Response
     */
    private function errorResponse(int $httpCode, string $message): Response
    {
        return new Response([
            'body' => json_encode(['error' => $message]),
            'httpCode' => $httpCode,
            'headers' => ['Content-Type: application/json']
        ]);
    }
}

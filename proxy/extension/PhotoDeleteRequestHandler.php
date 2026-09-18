<?php

namespace Oak\Proxy;

use Tent\RequestHandlers\RequestHandler;
use Tent\Models\RequestInterface;
use Tent\Models\Response;
use Tent\Http\HttpClientInterface;
use Tent\Http\CurlHttpClient;

/**
 * Handles the photo deletion flow.
 *
 * Matches `DELETE /uploads/categories/:category_slug/items/:item_id/photos/:id`
 * (see `docker_volumes/proxy_configuration/rules/uploads.php`) and, per
 * `docs/agents/issues/264-proxy-photo-deletion-route-and-handler.md`:
 *
 * 1. Calls the backend's `deletable.json` gate with the incoming `Cookie`
 *    header forwarded — the pre-delete authorization gate. On a non-2xx
 *    response, the backend's status/body is relayed as-is and nothing is
 *    deleted.
 * 2. Deletes `<photosPath>/<file_path>` from disk, using the `file_path`
 *    returned by the gate call — a file that is already missing (or a path
 *    the `PhotoPathGuard` rejects) is treated as a harmless no-op, not an
 *    error.
 * 3. Calls the backend's `DELETE .../photos/:id.json` to remove the row
 *    (only after the disk step completes — a partial failure must leave an
 *    orphaned-but-harmless missing-file reference, never a dangling file
 *    with no owning row).
 * 4. Responds `200` to the frontend.
 */
class PhotoDeleteRequestHandler extends RequestHandler
{
    /**
     * Matches `/uploads/categories/:category_slug/items/:item_id/photos/:id`.
     */
    private const PATH_PATTERN =
        '#^/uploads/categories/(?<category_slug>[^/]+)/items/(?<item_id>\d+)/photos/(?<id>\d+)/?$#';

    /** @var string Backend base URL (e.g. 'http://backend:3000'). */
    private string $host;

    /** @var string Local filesystem base path backing `Settings.photos_path`. */
    private string $photosPath;

    /** @var HttpClientInterface Client used for the outbound backend calls. */
    private HttpClientInterface $httpClient;

    /** @var PhotoPathGuard Guards the unlink target against path traversal/escapes. */
    private PhotoPathGuard $pathGuard;

    /**
     * @param string                   $host       Backend base URL.
     * @param string                   $photosPath Local filesystem base path for photos.
     * @param HttpClientInterface|null $httpClient Optional HTTP client (defaults to CurlHttpClient).
     */
    public function __construct(
        string $host,
        string $photosPath,
        ?HttpClientInterface $httpClient = null
    ) {
        $this->host = rtrim($host, '/');
        $this->photosPath = rtrim($photosPath, '/');
        $this->httpClient = $httpClient ?? new CurlHttpClient();
        $this->pathGuard = new PhotoPathGuard();
    }

    /**
     * Builds a PhotoDeleteRequestHandler using named parameters.
     *
     * Example:
     *   PhotoDeleteRequestHandler::build([
     *     'host' => 'http://backend:3000',
     *     'photosPath' => '/tmp/photos'
     *   ])
     *
     * @param array $params Associative array with keys 'host' and 'photosPath'.
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            $params['host'] ?? '',
            $params['photosPath'] ?? '/tmp/photos'
        );
    }

    /**
     * Drives the deletion flow described in the class docblock.
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

        $cookie = $this->headerValue($request, 'Cookie');

        $deletableResponse = $this->callBackend('POST', $this->deletableUrl($segments), $cookie);

        if (!$deletableResponse->isSuccessful()) {
            return $deletableResponse;
        }

        $filePath = $this->extractFilePath($deletableResponse->body());

        if ($filePath === null) {
            return $this->errorResponse(502, 'Invalid response from backend');
        }

        $this->deleteFile($filePath);

        $deleteResponse = $this->callBackend('DELETE', $this->deleteUrl($segments), $cookie);

        if (!$deleteResponse->isSuccessful()) {
            return $deleteResponse;
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
     * Builds the backend's `deletable.json` gate URL for the given path segments.
     *
     * @param array $segments Path segments returned by parsePath().
     * @return string
     */
    private function deletableUrl(array $segments): string
    {
        return sprintf(
            '%s/categories/%s/items/%s/photos/%s/deletable.json',
            $this->host,
            $segments['category_slug'],
            $segments['item_id'],
            $segments['id']
        );
    }

    /**
     * Builds the backend's row-deletion URL for the given path segments.
     *
     * @param array $segments Path segments returned by parsePath().
     * @return string
     */
    private function deleteUrl(array $segments): string
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
     * Calls a backend endpoint, forwarding the incoming request's `Cookie`
     * header, if any.
     *
     * @param string      $method The HTTP method to use.
     * @param string      $url    The backend URL to call.
     * @param string|null $cookie The incoming request's forwarded Cookie header, if any.
     * @return Response
     */
    private function callBackend(string $method, string $url, ?string $cookie): Response
    {
        $headers = [];

        if ($cookie !== null) {
            $headers['Cookie'] = $cookie;
        }

        $result = $this->httpClient->request($method, $url, $headers);

        return new Response($result);
    }

    /**
     * Extracts the `file_path` from the `deletable.json` gate call's JSON response body.
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
     * Deletes `<photosPath>/<filePath>` from disk, if it exists.
     *
     * Does not create any directories — unlike Submit's write path, the
     * destination directory is expected to already exist for a `ready`
     * photo. A missing file (or a path the guard rejects as unsafe) is
     * logged and treated as a harmless no-op, never an error.
     *
     * @param string $filePath The file path to delete, relative to photosPath.
     * @return void
     */
    private function deleteFile(string $filePath): void
    {
        $safeDestination = $this->pathGuard->resolve($this->photosPath, $filePath);

        if ($safeDestination === null) {
            error_log(sprintf(
                'PhotoDeleteRequestHandler: rejected unsafe file_path "%s" under photosPath "%s"',
                $filePath,
                $this->photosPath
            ));

            return;
        }

        if (!file_exists($safeDestination)) {
            error_log(sprintf(
                'PhotoDeleteRequestHandler: file already missing at "%s", skipping unlink',
                $safeDestination
            ));

            return;
        }

        unlink($safeDestination);
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

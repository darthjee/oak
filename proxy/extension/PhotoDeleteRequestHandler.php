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
    use PhotoRequestHandlerHelpers;

    /**
     * Matches `/uploads/categories/:category_slug/items/:item_id/photos/:id`.
     */
    private const PATH_PATTERN =
        '#^/uploads/categories/(?<category_slug>[^/]+)/items/(?<item_id>\d+)/photos/(?<id>\d+)/?$#';

    /** @var string Local filesystem base path backing `Settings.photos_path`. */
    private string $photosPath;

    /** @var PhotoPathGuard Guards the unlink target against path traversal/escapes. */
    private PhotoPathGuard $pathGuard;

    /** @var PhotoDeleteBackendGateway Handles the outbound deletable/delete backend calls. */
    private PhotoDeleteBackendGateway $gateway;

    /** @var PhotoFileDeleter Deletes the photo file from disk. */
    private PhotoFileDeleter $fileDeleter;

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
        $this->photosPath = rtrim($photosPath, '/');
        $this->pathGuard = new PhotoPathGuard();
        $this->gateway = new PhotoDeleteBackendGateway($host, $httpClient ?? new CurlHttpClient());
        $this->fileDeleter = new PhotoFileDeleter($this->photosPath, $this->pathGuard);
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

        $deletableResponse = $this->gateway->checkDeletable($segments, $cookie);

        if ($deletableResponse->isSuccessful() === FALSE) {
            return $deletableResponse;
        }

        $filePath = $this->extractFilePath($deletableResponse->body());

        if ($filePath === null) {
            return $this->errorResponse(502, 'Invalid response from backend');
        }

        $this->fileDeleter->delete($filePath);

        $deleteResponse = $this->gateway->deleteRow($segments, $cookie);

        if ($deleteResponse->isSuccessful() === FALSE) {
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
}

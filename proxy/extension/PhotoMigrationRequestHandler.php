<?php

namespace Oak\Proxy;

use Tent\RequestHandlers\RequestHandler;
use Tent\Models\RequestInterface;
use Tent\Models\Response;
use Tent\Http\HttpClientInterface;
use Tent\Http\CurlHttpClient;

/**
 * Handles `POST /migrations/photos?limit=N`: migrates one batch of the
 * logged-in user's legacy photo files to their backend-assigned names.
 *
 * Per `docs/agents/issues/381-proxy-migrations-photos-handler-moving-legacy-files.md`:
 *
 * 1. Calls the backend's `prepare` endpoint with the incoming `Cookie`
 *    header and `limit` forwarded (delegated to
 *    `PhotoMigrationBackendGateway`). On a non-2xx response, the backend's
 *    status/body is relayed as-is and no file is touched.
 * 2. Validates and migrates every returned photo (delegated to
 *    `PhotoMigrationBatchRunner`/`PhotoFileMover`): each photo ends up
 *    `migrated`, `missing` or `failed`. Only backend-provided paths are
 *    used; nothing path-related comes from the incoming request.
 * 3. Confirms the `migrated`/`missing` ids to the backend (skipped when
 *    both are empty). A failed confirmation responds `502`.
 * 4. Responds `200` with
 *    `{"migrated": <int>, "missing": [ids], "failed": [{"id","reason"}], "remaining": <int>}`.
 */
class PhotoMigrationRequestHandler extends RequestHandler
{
    use PhotoRequestHandlerHelpers;

    /** @var PhotoMigrationBackendGateway Makes the outbound prepare/confirm calls. */
    private PhotoMigrationBackendGateway $gateway;

    /** @var PhotoMigrationBatchRunner Validates and migrates each photo of a batch. */
    private PhotoMigrationBatchRunner $runner;

    /**
     * @param string                   $host        Backend base URL.
     * @param string                   $storageRoot Root holding the new photos/ and snaps/.
     * @param string                   $legacyRoot  Root holding the legacy photos/ and snaps/.
     * @param HttpClientInterface|null $httpClient  Optional HTTP client (defaults to CurlHttpClient).
     */
    public function __construct(
        string $host,
        string $storageRoot,
        string $legacyRoot,
        ?HttpClientInterface $httpClient = null
    ) {
        $pathGuard = new PhotoPathGuard();

        $this->gateway = new PhotoMigrationBackendGateway($host, $httpClient ?? new CurlHttpClient());
        $this->runner = new PhotoMigrationBatchRunner(
            $pathGuard,
            new PhotoFileMover($legacyRoot, $storageRoot, $pathGuard)
        );
    }

    /**
     * Builds a PhotoMigrationRequestHandler using named parameters.
     *
     * Example:
     *   PhotoMigrationRequestHandler::build([
     *     'host' => 'http://backend:3000',
     *     'storageRoot' => '/tmp/photos',
     *     'legacyRoot' => '/tmp/photos'
     *   ])
     *
     * @param array $params Associative array with keys 'host', 'storageRoot' and 'legacyRoot'.
     * @return self
     */
    public static function build(array $params): self
    {
        return new self(
            $params['host'] ?? '',
            $params['storageRoot'] ?? '/tmp/photos',
            $params['legacyRoot'] ?? '/tmp/photos'
        );
    }

    /**
     * Drives the migration flow described in the class docblock.
     *
     * @param RequestInterface $request The incoming HTTP request.
     * @return Response
     */
    protected function processsRequest(RequestInterface $request): Response
    {
        $cookie = $this->headerValue($request, 'Cookie');

        $prepareResponse = $this->gateway->prepare($this->parseLimit((string) $request->query()), $cookie);

        if ($prepareResponse->isSuccessful() === FALSE) {
            return $prepareResponse;
        }

        $batch = $this->decodeBatch($prepareResponse->body());

        if ($batch === null) {
            return $this->errorResponse(502, 'Invalid response from backend');
        }

        $result = $this->runner->run($batch['photos']);

        if ($this->confirm($result, $cookie) === FALSE) {
            return $this->errorResponse(502, 'Failed to confirm migration');
        }

        $remaining = $batch['remaining'] - count($result['migrated']) - count($result['missing']);

        return new Response([
            'body' => json_encode([
                'migrated' => count($result['migrated']),
                'missing' => $result['missing'],
                'failed' => $result['failed'],
                'remaining' => max(0, $remaining)
            ]),
            'httpCode' => 200,
            'headers' => ['Content-Type: application/json'],
            'request' => $request
        ]);
    }

    /**
     * Extracts the numeric `limit` from the incoming query string.
     *
     * @param string $query The incoming request's query string.
     * @return integer|null
     */
    private function parseLimit(string $query): ?int
    {
        parse_str($query, $params);

        $limit = $params['limit'] ?? null;

        return is_string($limit) && is_numeric($limit) ? (int) $limit : null;
    }

    /**
     * Decodes the `prepare` response body.
     *
     * @param string $body The `prepare` response body.
     * @return array{photos: array, remaining: int}|null Null when malformed.
     */
    private function decodeBatch(string $body): ?array
    {
        $decoded = json_decode($body, true);

        if (
            is_array($decoded) === FALSE
            || is_array($decoded['photos'] ?? null) === FALSE
            || is_int($decoded['remaining'] ?? null) === FALSE
        ) {
            return null;
        }

        return ['photos' => $decoded['photos'], 'remaining' => $decoded['remaining']];
    }

    /**
     * Confirms the migrated/missing ids to the backend, unless both are empty.
     *
     * @param array       $result The batch result returned by PhotoMigrationBatchRunner.
     * @param string|null $cookie The incoming request's forwarded Cookie header, if any.
     * @return boolean False when the confirmation failed.
     */
    private function confirm(array $result, ?string $cookie): bool
    {
        if (empty($result['migrated']) && empty($result['missing'])) {
            return true;
        }

        return $this->gateway->confirm($result['migrated'], $result['missing'], $cookie)->isSuccessful();
    }
}

<?php

namespace Oak\Proxy;

use Tent\Http\HttpClientInterface;
use Tent\Models\Response;

/**
 * Encapsulates the two outbound backend calls of the legacy photo
 * migration flow: `prepare` (claims a batch of the caller's legacy photos
 * and returns their legacy/new paths) and `confirm` (reports which of them
 * were migrated or found missing).
 *
 * Transport errors surface as a non-2xx `Response` (cURL reports an
 * `httpCode` of `0`), so callers only need `Response::isSuccessful()`.
 */
class PhotoMigrationBackendGateway
{
    /** @var string Backend base URL (e.g. 'http://backend:3000'). */
    private string $host;

    /** @var HttpClientInterface Client used for the outbound backend calls. */
    private HttpClientInterface $httpClient;

    /**
     * @param string              $host       Backend base URL.
     * @param HttpClientInterface $httpClient Client used for the outbound backend calls.
     */
    public function __construct(string $host, HttpClientInterface $httpClient)
    {
        $this->host = rtrim($host, '/');
        $this->httpClient = $httpClient;
    }

    /**
     * Calls `POST /user/photos/migration/prepare`, forwarding the incoming
     * request's `Cookie` header, if any.
     *
     * @param integer|null $limit  Batch size to request (omitted when null).
     * @param string|null  $cookie The incoming request's forwarded Cookie header, if any.
     * @return Response
     */
    public function prepare(?int $limit, ?string $cookie): Response
    {
        $url = $this->host . '/user/photos/migration/prepare';

        if ($limit !== null) {
            $url .= '?limit=' . $limit;
        }

        $result = $this->httpClient->request('POST', $url, $this->headers($cookie));

        return new Response($result);
    }

    /**
     * Calls `PATCH /user/photos/migration` with the migrated/missing ids,
     * forwarding the incoming request's `Cookie` header, if any.
     *
     * @param array       $migrated Ids of the photos whose files were migrated.
     * @param array       $missing  Ids of the photos whose files are missing.
     * @param string|null $cookie   The incoming request's forwarded Cookie header, if any.
     * @return Response
     */
    public function confirm(array $migrated, array $missing, ?string $cookie): Response
    {
        $headers = array_merge(['Content-Type' => 'application/json'], $this->headers($cookie));

        $result = $this->httpClient->request(
            'PATCH',
            $this->host . '/user/photos/migration',
            $headers,
            json_encode([
                'migrated' => array_values($migrated),
                'missing' => array_values($missing)
            ])
        );

        return new Response($result);
    }

    /**
     * Builds the outbound headers, forwarding the Cookie header when present.
     *
     * @param string|null $cookie The incoming request's forwarded Cookie header, if any.
     * @return array
     */
    private function headers(?string $cookie): array
    {
        if ($cookie === null) {
            return [];
        }

        return ['Cookie' => $cookie];
    }
}

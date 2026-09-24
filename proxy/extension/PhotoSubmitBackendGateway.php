<?php

namespace Oak\Proxy;

use Tent\Http\HttpClientInterface;
use Tent\Models\Response;

/**
 * Encapsulates the two outbound backend calls of the photo Submit flow:
 * the pre-write status gate (`{ status: "uploading" }`) and Finalize
 * (`{ status: "ready" }`), both sent as a `PATCH` to the photo's JSON
 * endpoint.
 */
class PhotoSubmitBackendGateway
{
    /** @var string Backend base URL (e.g. 'http://backend:3000'). */
    private string $host;

    /** @var HttpClientInterface Client used for the outbound status-gate calls. */
    private HttpClientInterface $httpClient;

    /**
     * @param string              $host       Backend base URL.
     * @param HttpClientInterface $httpClient Client used for the outbound status-gate calls.
     */
    public function __construct(string $host, HttpClientInterface $httpClient)
    {
        $this->host = rtrim($host, '/');
        $this->httpClient = $httpClient;
    }

    /**
     * Calls the pre-write status gate (`{ status: "uploading" }`), forwarding
     * the incoming request's `Cookie` header, if any.
     *
     * @param array       $segments Path segments returned by parsePath().
     * @param string|null $cookie   The incoming request's forwarded Cookie header, if any.
     * @return Response
     */
    public function markUploading(array $segments, ?string $cookie): Response
    {
        return $this->callGate($this->gateUrl($segments), 'uploading', $cookie);
    }

    /**
     * Calls Finalize (`{ status: "ready" }`), forwarding the incoming
     * request's `Cookie` header, if any.
     *
     * @param array       $segments Path segments returned by parsePath().
     * @param string|null $cookie   The incoming request's forwarded Cookie header, if any.
     * @return Response
     */
    public function markReady(array $segments, ?string $cookie): Response
    {
        return $this->callGate($this->gateUrl($segments), 'ready', $cookie);
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
}

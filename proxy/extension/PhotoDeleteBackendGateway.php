<?php

namespace Oak\Proxy;

use Tent\Http\HttpClientInterface;
use Tent\Models\Response;

/**
 * Encapsulates the two outbound backend calls of the photo deletion flow:
 * the `deletable.json` pre-delete authorization gate, and the row-delete
 * call that removes the photo record once the file has been unlinked.
 */
class PhotoDeleteBackendGateway
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
     * Calls the backend's `deletable.json` gate, forwarding the incoming
     * request's `Cookie` header, if any.
     *
     * @param array       $segments Path segments returned by parsePath().
     * @param string|null $cookie   The incoming request's forwarded Cookie header, if any.
     * @return Response
     */
    public function checkDeletable(array $segments, ?string $cookie): Response
    {
        return $this->callBackend('POST', $this->deletableUrl($segments), $cookie);
    }

    /**
     * Calls the backend's row-deletion endpoint, forwarding the incoming
     * request's `Cookie` header, if any.
     *
     * @param array       $segments Path segments returned by parsePath().
     * @param string|null $cookie   The incoming request's forwarded Cookie header, if any.
     * @return Response
     */
    public function deleteRow(array $segments, ?string $cookie): Response
    {
        return $this->callBackend('DELETE', $this->deleteUrl($segments), $cookie);
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
}

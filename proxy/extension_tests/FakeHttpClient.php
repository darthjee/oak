<?php

namespace Oak\Proxy\Tests;

use Tent\Http\HttpClientInterface;

/**
 * Records every outbound call made through it and replays the configured
 * responses in order (one per call). Used as a test double for the
 * PhotoSubmitRequestHandler/PhotoDeleteRequestHandler's outbound
 * status-gate/Finalize/deletable/DELETE calls.
 */
class FakeHttpClient implements HttpClientInterface
{
    /** @var array List of calls made through this client, in order. */
    public array $calls = [];

    /** @var array Queue of responses to return, one per call. */
    private array $responses;

    public function __construct(array $responses = [])
    {
        $this->responses = $responses;
    }

    public function request(
        string $method,
        string $url,
        array $headers,
        ?string $body = null,
        array $uploadedFiles = [],
        array $postFields = []
    ): array {
        $this->calls[] = [
            'method' => $method,
            'url' => $url,
            'headers' => $headers,
            'body' => $body,
            'uploadedFiles' => $uploadedFiles,
            'postFields' => $postFields
        ];

        return array_shift($this->responses) ?? ['body' => '', 'httpCode' => 200, 'headers' => []];
    }
}

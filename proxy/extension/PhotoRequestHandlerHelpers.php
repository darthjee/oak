<?php

namespace Oak\Proxy;

use Tent\Models\RequestInterface;
use Tent\Models\Response;

/**
 * Shared helpers for photo upload/delete request handlers.
 *
 * Both `PhotoDeleteRequestHandler` and `PhotoSubmitRequestHandler` extend the
 * vendored `Tent\RequestHandlers\RequestHandler`, so this is a trait (not a
 * shared abstract base class) to avoid disturbing that inheritance.
 */
trait PhotoRequestHandlerHelpers
{
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
     * Extracts the `file_path` from the gate call's JSON response body.
     *
     * @param string $body The gate call's response body.
     * @return string|null
     */
    private function extractFilePath(string $body): ?string
    {
        $decoded = json_decode($body, true);

        if (
            is_array($decoded) === FALSE
            || isset($decoded['file_path']) === FALSE
            || is_string($decoded['file_path']) === FALSE
        ) {
            return null;
        }

        return $decoded['file_path'];
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

<?php

namespace Oak\Proxy;

use Tent\Middlewares\Middleware;
use Tent\Models\Response;

/**
 * Sets a `Cache-Control: max-age=<N>` response header on successful (2xx)
 * responses, replacing any existing occurrence of the header
 * (case-insensitive) so the client always receives a single value.
 *
 * ## Why only 2xx responses?
 *
 * Snaps (resized photo versions) are generated asynchronously, after the
 * original photo is uploaded. A request for a snap that does not exist yet
 * returns a 404; if that 404 carried a long `max-age`, browsers and caches
 * would keep serving the 404 for the whole max-age, hiding the snap once it
 * is generated. Non-2xx responses are therefore returned unchanged.
 *
 * ## Why not a built-in Tent middleware?
 *
 * Tent's `SetHeadersMiddleware` sets request headers, and
 * `CacheStalenessMiddleware` only schedules background re-fetches of
 * responses cached by `FileCacheMiddleware` from an upstream host — neither
 * applies to rules using the `static` handler.
 *
 * ## Usage in configuration
 *
 * ```php
 * Configuration::buildRule([
 *     'handler' => [...],
 *     'matchers' => [...],
 *     'middlewares' => [
 *         [
 *             'class' => 'Oak\\Proxy\\CacheControlMiddleware',
 *             'maxAgeSeconds' => 60 * 60 * 24 * 7
 *         ]
 *     ]
 * ]);
 * ```
 */
class CacheControlMiddleware extends Middleware
{
    private const HEADER_NAME = 'Cache-Control';

    /**
     * @var integer Maximum age, in seconds, advertised via `max-age`.
     */
    private int $maxAgeSeconds;

    /**
     * @param integer $maxAgeSeconds Maximum age, in seconds, advertised via `max-age`.
     */
    public function __construct(int $maxAgeSeconds)
    {
        $this->maxAgeSeconds = $maxAgeSeconds;
    }

    /**
     * Builds a CacheControlMiddleware instance from given attributes.
     *
     * @param array $attributes Associative array of attributes; supports
     *                          'maxAgeSeconds' (or 'max_age_seconds').
     * @return CacheControlMiddleware The constructed middleware instance.
     */
    public static function build(array $attributes): CacheControlMiddleware
    {
        $maxAgeSeconds = (int) ($attributes['maxAgeSeconds'] ?? $attributes['max_age_seconds'] ?? 0);

        return new self($maxAgeSeconds);
    }

    /**
     * On a 2xx response, replaces any existing `Cache-Control` header
     * line(s) with a single `Cache-Control: max-age=<N>` line, leaving every
     * other header untouched and in order. Non-2xx responses are returned
     * unchanged.
     *
     * @param Response $response The response to process.
     * @return Response The processed response.
     */
    public function processResponse(Response $response): Response
    {
        if ($this->isSuccessful($response) === FALSE) {
            return $response;
        }

        $filtered = array_values(array_filter(
            $response->headers(),
            fn (string $headerLine): bool => $this->isCacheControl($headerLine) === FALSE
        ));

        $filtered[] = self::HEADER_NAME . ': max-age=' . $this->maxAgeSeconds;

        $response->setHeaders($filtered);

        return $response;
    }

    /**
     * Checks whether the response has a 2xx status code.
     *
     * @param Response $response The response to check.
     * @return boolean
     */
    private function isSuccessful(Response $response): bool
    {
        $httpCode = $response->httpCode();

        return $httpCode >= 200 && $httpCode < 300;
    }

    /**
     * Checks whether a header line is a `Cache-Control` header (case-insensitive).
     *
     * @param string $headerLine The raw header line.
     * @return boolean
     */
    private function isCacheControl(string $headerLine): bool
    {
        $name = strstr($headerLine, ':', true);

        if ($name === false) {
            $name = $headerLine;
        }

        return strtolower(trim($name)) === strtolower(self::HEADER_NAME);
    }
}

<?php

namespace Oak\Proxy\Tests;

use Oak\Proxy\CacheControlMiddleware;
use PHPUnit\Framework\TestCase;
use Tent\Models\Response;

/**
 * Spec for Oak\Proxy\CacheControlMiddleware.
 *
 * CacheControlMiddleware::build() is Tent's static middleware factory
 * contract, so the build tests must call it statically.
 *
 * @SuppressWarnings("PHPMD.StaticAccess")
 */
class CacheControlMiddlewareTest extends TestCase
{
    private const MAX_AGE = 604800;

    private function makeResponse(int $httpCode, array $headers): Response
    {
        return new Response([
            'body' => '',
            'httpCode' => $httpCode,
            'headers' => $headers,
        ]);
    }

    public function testAddsCacheControlHeaderOnSuccessfulResponse(): void
    {
        $response = $this->makeResponse(200, ['Content-Type: image/jpeg']);
        $middleware = new CacheControlMiddleware(self::MAX_AGE);

        $result = $middleware->processResponse($response);

        $this->assertSame([
            'Content-Type: image/jpeg',
            'Cache-Control: max-age=604800',
        ], $result->headers());
    }

    public function testAddsCacheControlHeaderOnOtherSuccessfulCodes(): void
    {
        $response = $this->makeResponse(206, []);
        $middleware = new CacheControlMiddleware(self::MAX_AGE);

        $result = $middleware->processResponse($response);

        $this->assertSame(['Cache-Control: max-age=604800'], $result->headers());
    }

    public function testReplacesExistingCacheControlHeadersCaseInsensitively(): void
    {
        $response = $this->makeResponse(200, [
            'cache-control: public, max-age=3600',
            'X-Request-Id: abc-123',
            'Cache-Control: no-store',
            'CACHE-CONTROL: no-cache',
            'Content-Type: image/jpeg',
        ]);
        $middleware = new CacheControlMiddleware(self::MAX_AGE);

        $result = $middleware->processResponse($response);

        $this->assertSame([
            'X-Request-Id: abc-123',
            'Content-Type: image/jpeg',
            'Cache-Control: max-age=604800',
        ], $result->headers());
    }

    public function testLeavesOtherHeadersUntouchedAndInOrder(): void
    {
        $headers = [
            'Content-Type: image/jpeg',
            'Content-Length: 1024',
            'X-Cache-Control-Hint: keep',
        ];
        $response = $this->makeResponse(200, $headers);
        $middleware = new CacheControlMiddleware(self::MAX_AGE);

        $result = $middleware->processResponse($response);

        $this->assertSame(
            array_merge($headers, ['Cache-Control: max-age=604800']),
            $result->headers()
        );
    }

    /**
     * @dataProvider nonSuccessfulCodes
     */
    public function testLeavesNonSuccessfulResponsesUnchanged(int $httpCode): void
    {
        $headers = ['Content-Type: text/plain', 'Cache-Control: no-cache'];
        $response = $this->makeResponse($httpCode, $headers);
        $middleware = new CacheControlMiddleware(self::MAX_AGE);

        $result = $middleware->processResponse($response);

        $this->assertSame($response, $result);
        $this->assertSame($headers, $result->headers());
        $this->assertSame($httpCode, $result->httpCode());
    }

    public static function nonSuccessfulCodes(): array
    {
        return [
            'redirect' => [302],
            'not modified' => [304],
            'not found' => [404],
            'server error' => [500],
        ];
    }

    public function testBuildUsesMaxAgeSecondsAttribute(): void
    {
        $middleware = CacheControlMiddleware::build(['maxAgeSeconds' => self::MAX_AGE]);

        $result = $middleware->processResponse($this->makeResponse(200, []));

        $this->assertSame(['Cache-Control: max-age=604800'], $result->headers());
    }

    public function testBuildUsesSnakeCaseMaxAgeSecondsAttribute(): void
    {
        $middleware = CacheControlMiddleware::build(['max_age_seconds' => 86400]);

        $result = $middleware->processResponse($this->makeResponse(200, []));

        $this->assertSame(['Cache-Control: max-age=86400'], $result->headers());
    }

    public function testBuildDefaultsToZeroMaxAge(): void
    {
        $middleware = CacheControlMiddleware::build([]);

        $result = $middleware->processResponse($this->makeResponse(200, []));

        $this->assertSame(['Cache-Control: max-age=0'], $result->headers());
    }
}

<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoMigrationRequestHandlerTestCase.php';

/**
 * Backend interaction of the photo migration handler: auth pass-through,
 * forwarded limit/cookie, malformed `prepare` bodies and `PATCH` failures.
 */
class PhotoMigrationRequestHandlerTest extends PhotoMigrationRequestHandlerTestCase
{
    protected function tempDirPrefix(): string
    {
        return 'photo_migration_handler_test_';
    }

    public function testRelaysAnUnauthorizedPrepareWithoutTouchingFiles(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH);
        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"unauthorized"}', 'httpCode' => 401, 'headers' => []]
        ]);

        $response = $this->handle($httpClient);

        $this->assertSame(401, $response->httpCode());
        $this->assertSame('{"error":"unauthorized"}', $response->body());
        $this->assertCount(1, $httpClient->calls);
        $this->assertSame($this->kindPaths(self::LEGACY_PATH), $this->filesUnder($this->legacyRoot));
    }

    public function testForwardsTheLimitAndCookie(): void
    {
        $httpClient = new FakeHttpClient([$this->prepareResponse([$this->photo(17)], 1)]);
        $this->seed($this->legacyRoot, self::LEGACY_PATH);

        $this->handle($httpClient, 'limit=7', 'session=abc123');

        $this->assertSame('POST', $httpClient->calls[0]['method']);
        $this->assertSame(self::PREPARE_URL . '?limit=7', $httpClient->calls[0]['url']);
        $this->assertSame('session=abc123', $httpClient->calls[0]['headers']['Cookie']);
        $this->assertSame('session=abc123', $httpClient->calls[1]['headers']['Cookie']);
    }

    public function testOmitsANonNumericLimit(): void
    {
        $httpClient = new FakeHttpClient([$this->prepareResponse([], 0)]);

        $this->handle($httpClient, 'limit=abc');

        $this->assertSame(self::PREPARE_URL, $httpClient->calls[0]['url']);
    }

    /**
     * @dataProvider malformedPrepareBodies
     */
    public function testRespondsBadGatewayOnAMalformedPrepareBody(string $body): void
    {
        $httpClient = new FakeHttpClient([['body' => $body, 'httpCode' => 200, 'headers' => []]]);

        $response = $this->handle($httpClient);

        $this->assertSame(502, $response->httpCode());
        $this->assertCount(1, $httpClient->calls);
    }

    public static function malformedPrepareBodies(): array
    {
        return [
            'not json' => ['not json'],
            'no photos' => ['{"remaining":3}'],
            'photos not a list' => ['{"photos":"x","remaining":3}'],
            'no remaining' => ['{"photos":[]}'],
            'remaining not an int' => ['{"photos":[],"remaining":"3"}']
        ];
    }

    public function testRespondsBadGatewayWhenThePatchFails(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH);
        $httpClient = new FakeHttpClient([
            $this->prepareResponse([$this->photo(17)], 1),
            ['body' => '', 'httpCode' => 0, 'headers' => []]
        ]);

        $response = $this->handle($httpClient);

        $this->assertSame(502, $response->httpCode());
        $this->assertSame(['error' => 'Failed to confirm migration'], $this->json($response));
        $this->assertSame($this->kindPaths(self::FILE_PATH), $this->filesUnder($this->storageRoot));
    }
}

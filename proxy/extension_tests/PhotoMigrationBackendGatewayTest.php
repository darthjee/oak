<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';

use Oak\Proxy\PhotoMigrationBackendGateway;
use PHPUnit\Framework\TestCase;

class PhotoMigrationBackendGatewayTest extends TestCase
{
    private const PREPARE_URL = 'http://backend:3000/user/photos/migration/prepare';

    private const CONFIRM_URL = 'http://backend:3000/user/photos/migration';

    public function testPrepareSendsTheLimit(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->prepare(5, null);

        $this->assertCount(1, $httpClient->calls);
        $this->assertSame('POST', $httpClient->calls[0]['method']);
        $this->assertSame(self::PREPARE_URL . '?limit=5', $httpClient->calls[0]['url']);
    }

    public function testPrepareOmitsTheLimitWhenNotGiven(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->prepare(null, null);

        $this->assertSame(self::PREPARE_URL, $httpClient->calls[0]['url']);
        $this->assertArrayNotHasKey('Cookie', $httpClient->calls[0]['headers']);
    }

    public function testForwardsTheCookieOnBothCalls(): void
    {
        $httpClient = new FakeHttpClient();
        $gateway = $this->buildGateway($httpClient);

        $gateway->prepare(5, 'session=abc123');
        $gateway->confirm([1], [], 'session=abc123');

        $this->assertSame('session=abc123', $httpClient->calls[0]['headers']['Cookie']);
        $this->assertSame('session=abc123', $httpClient->calls[1]['headers']['Cookie']);
    }

    public function testConfirmPatchesTheMigratedAndMissingIdsAsJson(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->confirm([17, 19], [18], null);

        $call = $httpClient->calls[0];
        $this->assertSame('PATCH', $call['method']);
        $this->assertSame(self::CONFIRM_URL, $call['url']);
        $this->assertSame('application/json', $call['headers']['Content-Type']);
        $this->assertArrayNotHasKey('Cookie', $call['headers']);
        $this->assertSame('{"migrated":[17,19],"missing":[18]}', $call['body']);
    }

    public function testConfirmAlwaysSendsJsonArrays(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->confirm([3 => 17], [], null);

        $this->assertSame('{"migrated":[17],"missing":[]}', $httpClient->calls[0]['body']);
    }

    public function testReturnsTheBackendResponseAsIs(): void
    {
        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"unauthorized"}', 'httpCode' => 401, 'headers' => []]
        ]);

        $response = $this->buildGateway($httpClient)->prepare(5, null);

        $this->assertSame(401, $response->httpCode());
        $this->assertSame('{"error":"unauthorized"}', $response->body());
    }

    /**
     * Builds the gateway under test; the trailing slash on the host
     * exercises its trimming.
     */
    private function buildGateway(FakeHttpClient $httpClient): PhotoMigrationBackendGateway
    {
        return new PhotoMigrationBackendGateway('http://backend:3000/', $httpClient);
    }
}

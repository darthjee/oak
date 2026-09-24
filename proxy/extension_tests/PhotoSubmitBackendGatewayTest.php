<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';

use Oak\Proxy\PhotoSubmitBackendGateway;
use PHPUnit\Framework\TestCase;

class PhotoSubmitBackendGatewayTest extends TestCase
{
    private const GATE_URL = 'http://backend:3000/categories/miniatures/items/42/photos/7.json';

    private const SEGMENTS = ['category_slug' => 'miniatures', 'item_id' => '42', 'id' => '7'];

    public function testMarkUploadingPatchesTheGateWithUploadingStatus(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->markUploading(self::SEGMENTS, null);

        $this->assertCount(1, $httpClient->calls);
        $this->assertSame('PATCH', $httpClient->calls[0]['method']);
        $this->assertSame(self::GATE_URL, $httpClient->calls[0]['url']);
        $this->assertSame('{"status":"uploading"}', $httpClient->calls[0]['body']);
        $this->assertSame('application/json', $httpClient->calls[0]['headers']['Content-Type']);
    }

    public function testMarkReadyPatchesTheGateWithReadyStatus(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->markReady(self::SEGMENTS, null);

        $this->assertCount(1, $httpClient->calls);
        $this->assertSame('PATCH', $httpClient->calls[0]['method']);
        $this->assertSame(self::GATE_URL, $httpClient->calls[0]['url']);
        $this->assertSame('{"status":"ready"}', $httpClient->calls[0]['body']);
        $this->assertSame('application/json', $httpClient->calls[0]['headers']['Content-Type']);
    }

    public function testForwardsTheCookieWhenGiven(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->markUploading(self::SEGMENTS, 'session=abc123');

        $this->assertSame('session=abc123', $httpClient->calls[0]['headers']['Cookie']);
    }

    public function testSendsNoCookieHeaderWhenCookieIsNull(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->markReady(self::SEGMENTS, null);

        $this->assertArrayNotHasKey('Cookie', $httpClient->calls[0]['headers']);
    }

    public function testReturnsTheBackendResponseAsIs(): void
    {
        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"forbidden"}', 'httpCode' => 403, 'headers' => []]
        ]);

        $response = $this->buildGateway($httpClient)->markUploading(self::SEGMENTS, null);

        $this->assertSame(403, $response->httpCode());
        $this->assertSame('{"error":"forbidden"}', $response->body());
    }

    private function buildGateway(FakeHttpClient $httpClient): PhotoSubmitBackendGateway
    {
        return new PhotoSubmitBackendGateway('http://backend:3000/', $httpClient);
    }
}

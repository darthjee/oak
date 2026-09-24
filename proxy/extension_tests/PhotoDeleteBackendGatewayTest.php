<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';

use Oak\Proxy\PhotoDeleteBackendGateway;
use PHPUnit\Framework\TestCase;

class PhotoDeleteBackendGatewayTest extends TestCase
{
    private const DELETABLE_URL = 'http://backend:3000/categories/miniatures/items/42/photos/7/deletable.json';

    private const DESTROY_URL = 'http://backend:3000/categories/miniatures/items/42/photos/7.json';

    private const SEGMENTS = ['category_slug' => 'miniatures', 'item_id' => '42', 'id' => '7'];

    public function testCheckDeletablePostsToTheDeletableGate(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->checkDeletable(self::SEGMENTS, null);

        $this->assertCount(1, $httpClient->calls);
        $this->assertSame('POST', $httpClient->calls[0]['method']);
        $this->assertSame(self::DELETABLE_URL, $httpClient->calls[0]['url']);
    }

    public function testDeleteRowDeletesThePhotoRow(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->deleteRow(self::SEGMENTS, null);

        $this->assertCount(1, $httpClient->calls);
        $this->assertSame('DELETE', $httpClient->calls[0]['method']);
        $this->assertSame(self::DESTROY_URL, $httpClient->calls[0]['url']);
    }

    public function testForwardsTheCookieWhenGiven(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->checkDeletable(self::SEGMENTS, 'session=abc123');

        $this->assertSame('session=abc123', $httpClient->calls[0]['headers']['Cookie']);
    }

    public function testSendsNoCookieHeaderWhenCookieIsNull(): void
    {
        $httpClient = new FakeHttpClient();

        $this->buildGateway($httpClient)->deleteRow(self::SEGMENTS, null);

        $this->assertArrayNotHasKey('Cookie', $httpClient->calls[0]['headers']);
    }

    public function testReturnsTheBackendResponseAsIs(): void
    {
        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"forbidden"}', 'httpCode' => 403, 'headers' => []]
        ]);

        $response = $this->buildGateway($httpClient)->checkDeletable(self::SEGMENTS, null);

        $this->assertSame(403, $response->httpCode());
        $this->assertSame('{"error":"forbidden"}', $response->body());
    }

    /**
     * Builds the gateway under test; the trailing slash on the host
     * exercises its trimming.
     */
    private function buildGateway(FakeHttpClient $httpClient): PhotoDeleteBackendGateway
    {
        return new PhotoDeleteBackendGateway('http://backend:3000/', $httpClient);
    }
}

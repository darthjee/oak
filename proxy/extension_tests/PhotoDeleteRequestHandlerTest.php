<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';
require_once __DIR__ . '/PhotoDeleteRequestHandlerTestCase.php';

class PhotoDeleteRequestHandlerTest extends PhotoDeleteRequestHandlerTestCase
{
    private const FILE_PATH = 'users/1/items/42/photo.jpg';

    protected function tempDirPrefix(): string
    {
        return 'photo_delete_test_';
    }

    public function testHappyPathDeletesAllVersionsThenBackendRow(): void
    {
        $this->writeVersions(self::FILE_PATH);

        $httpClient = $this->successfulClient(self::FILE_PATH);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(200, $response->httpCode());
        $this->assertCount(2, $httpClient->calls);

        $this->assertSame('POST', $httpClient->calls[0]['method']);
        $this->assertSame(self::DELETABLE_URL, $httpClient->calls[0]['url']);

        $this->assertSame('DELETE', $httpClient->calls[1]['method']);
        $this->assertSame(self::DESTROY_URL, $httpClient->calls[1]['url']);

        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testNonSuccessfulDeletableGateIsRelayedWithoutDeletingAnything(): void
    {
        $this->writeVersions(self::FILE_PATH);

        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"not ready"}', 'httpCode' => 422, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(422, $response->httpCode());
        $this->assertSame('{"error":"not ready"}', $response->body());
        $this->assertCount(1, $httpClient->calls);
        $this->assertSame($this->versionPaths(self::FILE_PATH), $this->filesUnder($this->storageRoot));
    }

    public function testForbiddenDeletableGateIsRelayedWithoutDeletingAnything(): void
    {
        $this->writeVersions(self::FILE_PATH);

        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"forbidden"}', 'httpCode' => 403, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(403, $response->httpCode());
        $this->assertCount(1, $httpClient->calls);
        $this->assertSame($this->versionPaths(self::FILE_PATH), $this->filesUnder($this->storageRoot));
    }

    public function testNonSuccessfulBackendDeleteIsRelayedButFilesAreAlreadyGone(): void
    {
        $this->writeVersions(self::FILE_PATH);

        $httpClient = new FakeHttpClient([
            ['body' => json_encode(['file_path' => self::FILE_PATH]), 'httpCode' => 200, 'headers' => []],
            ['body' => '{"error":"not found"}', 'httpCode' => 404, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(404, $response->httpCode());
        $this->assertSame('{"error":"not found"}', $response->body());
        $this->assertCount(2, $httpClient->calls);

        // Disk-first ordering: even though the overall response is an
        // error, the file must already be gone by the time the backend
        // DELETE call happens.
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }
}

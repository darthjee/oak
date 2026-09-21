<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';
require_once __DIR__ . '/PhotoRequestHandlerTestCase.php';

use Oak\Proxy\PhotoDeleteRequestHandler;
use Tent\Models\ProcessingRequest;

class PhotoDeleteRequestHandlerTest extends PhotoRequestHandlerTestCase
{
    private const DELETE_PATH = '/uploads/categories/miniatures/items/42/photos/7';

    private const DELETABLE_URL = 'http://backend:3000/categories/miniatures/items/42/photos/7/deletable.json';

    private const DESTROY_URL = 'http://backend:3000/categories/miniatures/items/42/photos/7.json';

    protected function tempDirPrefix(): string
    {
        return 'photo_delete_test_';
    }

    public function testHappyPathDeletesFileThenBackendRow(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeExistingFile($filePath, 'bytes');

        $httpClient = new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
            ['body' => '', 'httpCode' => 200, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(200, $response->httpCode());
        $this->assertCount(2, $httpClient->calls);

        $this->assertSame('POST', $httpClient->calls[0]['method']);
        $this->assertSame(self::DELETABLE_URL, $httpClient->calls[0]['url']);

        $this->assertSame('DELETE', $httpClient->calls[1]['method']);
        $this->assertSame(self::DESTROY_URL, $httpClient->calls[1]['url']);

        $this->assertFileDoesNotExist($this->photosPath . '/' . $filePath);
    }

    public function testAlreadyMissingFileIsANoOpButBackendRowIsStillDeleted(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';

        $httpClient = new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
            ['body' => '', 'httpCode' => 200, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(200, $response->httpCode());
        $this->assertCount(2, $httpClient->calls);
        $this->assertSame('DELETE', $httpClient->calls[1]['method']);
        $this->assertFileDoesNotExist($this->photosPath . '/' . $filePath);
    }

    public function testNonSuccessfulDeletableGateIsRelayedWithoutDeletingAnything(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeExistingFile($filePath, 'bytes');

        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"not ready"}', 'httpCode' => 422, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(422, $response->httpCode());
        $this->assertSame('{"error":"not ready"}', $response->body());
        $this->assertCount(1, $httpClient->calls);
        $this->assertFileExists($this->photosPath . '/' . $filePath);
    }

    public function testForbiddenDeletableGateIsRelayedWithoutDeletingAnything(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeExistingFile($filePath, 'bytes');

        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"forbidden"}', 'httpCode' => 403, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(403, $response->httpCode());
        $this->assertCount(1, $httpClient->calls);
        $this->assertFileExists($this->photosPath . '/' . $filePath);
    }

    public function testNonSuccessfulBackendDeleteIsRelayedButFileIsAlreadyGone(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeExistingFile($filePath, 'bytes');

        $httpClient = new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
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
        $this->assertFileDoesNotExist($this->photosPath . '/' . $filePath);
    }

    public function testForwardsCookieOnBothBackendCalls(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeExistingFile($filePath, 'bytes');

        $httpClient = new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
            ['body' => '', 'httpCode' => 200, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $handler->handleRequest($this->buildRequest('session=abc123'));

        $this->assertSame('session=abc123', $httpClient->calls[0]['headers']['Cookie']);
        $this->assertSame('session=abc123', $httpClient->calls[1]['headers']['Cookie']);
    }

    private function buildHandler(FakeHttpClient $httpClient): PhotoDeleteRequestHandler
    {
        return new PhotoDeleteRequestHandler(
            'http://backend:3000',
            $this->photosPath,
            $httpClient
        );
    }

    private function buildRequest(?string $cookie = null): ProcessingRequest
    {
        $headers = $cookie !== null ? ['Cookie' => $cookie] : [];

        return new ProcessingRequest([
            'requestMethod' => 'DELETE',
            'requestPath' => self::DELETE_PATH,
            'headers' => $headers,
            'uploadedFiles' => [],
            'postFields' => []
        ]);
    }

    private function writeExistingFile(string $filePath, string $contents): void
    {
        $destination = $this->photosPath . '/' . $filePath;
        $dir = dirname($destination);

        if (is_dir($dir) === false) {
            mkdir($dir, 0775, true);
        }

        file_put_contents($destination, $contents);
    }
}

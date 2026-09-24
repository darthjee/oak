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

    private const PREFIXES = ['origin', 'photos', 'snaps'];

    /** @var string|false The error_log setting before the test silenced it. */
    private $previousErrorLog;

    protected function setUp(): void
    {
        parent::setUp();

        // The deleter logs every skipped version; keep the test output clean.
        $this->previousErrorLog = ini_set('error_log', '/dev/null');
    }

    protected function tearDown(): void
    {
        ini_set('error_log', $this->previousErrorLog === false ? '' : $this->previousErrorLog);

        parent::tearDown();
    }

    protected function tempDirPrefix(): string
    {
        return 'photo_delete_test_';
    }

    public function testHappyPathDeletesAllVersionsThenBackendRow(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeVersions($filePath);

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

        $this->assertSame([], $this->filesUnder($this->storageRoot));
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
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testOnlySomeVersionsPresentDeletesThoseAndSucceeds(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeVersions($filePath, ['origin']);

        $httpClient = new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
            ['body' => '', 'httpCode' => 200, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(200, $response->httpCode());
        $this->assertCount(2, $httpClient->calls);
        $this->assertSame('DELETE', $httpClient->calls[1]['method']);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testFilePathEscapingThePrefixFoldersDeletesNothingOutsideThem(): void
    {
        $this->writeVersions('escape.jpg', ['']);
        $this->writeVersions('users/1/items/42/photo.jpg');

        $httpClient = new FakeHttpClient([
            ['body' => json_encode(['file_path' => '../escape.jpg']), 'httpCode' => 200, 'headers' => []],
            ['body' => '', 'httpCode' => 200, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(200, $response->httpCode());
        $this->assertFileExists($this->storageRoot . '/escape.jpg');
        $this->assertCount(4, $this->filesUnder($this->storageRoot));
    }

    public function testNonSuccessfulDeletableGateIsRelayedWithoutDeletingAnything(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeVersions($filePath);

        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"not ready"}', 'httpCode' => 422, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(422, $response->httpCode());
        $this->assertSame('{"error":"not ready"}', $response->body());
        $this->assertCount(1, $httpClient->calls);
        $this->assertSame($this->versionPaths($filePath), $this->filesUnder($this->storageRoot));
    }

    public function testForbiddenDeletableGateIsRelayedWithoutDeletingAnything(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeVersions($filePath);

        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"forbidden"}', 'httpCode' => 403, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest());

        $this->assertSame(403, $response->httpCode());
        $this->assertCount(1, $httpClient->calls);
        $this->assertSame($this->versionPaths($filePath), $this->filesUnder($this->storageRoot));
    }

    public function testNonSuccessfulBackendDeleteIsRelayedButFilesAreAlreadyGone(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeVersions($filePath);

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
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testForwardsCookieOnBothBackendCalls(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $this->writeVersions($filePath);

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
            $this->storageRoot,
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

    /**
     * Seeds `<storageRoot>/<prefix>/<filePath>` for each given prefix.
     */
    private function writeVersions(string $filePath, array $prefixes = self::PREFIXES): void
    {
        foreach ($prefixes as $prefix) {
            $destination = rtrim($this->storageRoot . '/' . $prefix, '/') . '/' . $filePath;
            $dir = dirname($destination);

            if (is_dir($dir) === false) {
                mkdir($dir, 0775, true);
            }

            file_put_contents($destination, 'bytes');
        }
    }

    /**
     * The sorted, storageRoot-relative paths of every version of `$filePath`.
     */
    private function versionPaths(string $filePath): array
    {
        return array_map(fn ($prefix) => $prefix . '/' . $filePath, self::PREFIXES);
    }
}

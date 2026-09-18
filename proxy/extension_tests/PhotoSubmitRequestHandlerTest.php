<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';

use Oak\Proxy\PhotoSubmitRequestHandler;
use PHPUnit\Framework\TestCase;
use Tent\Models\ProcessingRequest;

class PhotoSubmitRequestHandlerTest extends TestCase
{
    private const SUBMIT_PATH = '/uploads/categories/miniatures/items/42/photos/7/submit';

    private string $photosPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->photosPath = sys_get_temp_dir() . '/photo_submit_test_' . uniqid();
        mkdir($this->photosPath, 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirRecursive($this->photosPath);

        parent::tearDown();
    }

    public function testRejectsDisallowedExtensionWithoutCallingBackendOrWriting(): void
    {
        $httpClient = new FakeHttpClient();
        $handler = $this->buildHandler($httpClient);
        $uploadedFile = $this->buildUploadedFile('photo.txt', 'not a photo');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile));

        $this->assertSame(415, $response->httpCode());
        $this->assertSame([], $httpClient->calls);
        $this->assertDirectoryDoesNotExist($this->photosPath . '/users');
    }

    public function testRejectsOversizedUploadWithoutCallingBackendOrWriting(): void
    {
        $httpClient = new FakeHttpClient();
        $handler = $this->buildHandler($httpClient, 4);
        $uploadedFile = $this->buildUploadedFile('photo.jpg', 'way too large for the limit');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile));

        $this->assertSame(413, $response->httpCode());
        $this->assertSame([], $httpClient->calls);
        $this->assertDirectoryDoesNotExist($this->photosPath . '/users');
    }

    public function testStopsBeforeWritingWhenTheUploadingGateIsRejected(): void
    {
        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"forbidden"}', 'httpCode' => 403, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);
        $uploadedFile = $this->buildUploadedFile('photo.jpg', 'bytes');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile));

        $this->assertSame(403, $response->httpCode());
        $this->assertSame('{"error":"forbidden"}', $response->body());
        $this->assertCount(1, $httpClient->calls);
        $this->assertDirectoryDoesNotExist($this->photosPath . '/users');
    }

    public function testHappyPathGatesWritesAndFinalizes(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $httpClient = new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
            ['body' => '{}', 'httpCode' => 200, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);
        $uploadedFile = $this->buildUploadedFile('photo.jpg', 'some bytes');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile, 'session=abc123'));

        $this->assertSame(200, $response->httpCode());
        $this->assertCount(2, $httpClient->calls);

        $gateUrl = 'http://backend:3000/categories/miniatures/items/42/photos/7.json';

        $this->assertSame('PATCH', $httpClient->calls[0]['method']);
        $this->assertSame($gateUrl, $httpClient->calls[0]['url']);
        $this->assertSame('{"status":"uploading"}', $httpClient->calls[0]['body']);
        $this->assertSame('session=abc123', $httpClient->calls[0]['headers']['Cookie']);

        $this->assertSame('PATCH', $httpClient->calls[1]['method']);
        $this->assertSame($gateUrl, $httpClient->calls[1]['url']);
        $this->assertSame('{"status":"ready"}', $httpClient->calls[1]['body']);

        $writtenPath = $this->photosPath . '/' . $filePath;
        $this->assertFileExists($writtenPath);
        $this->assertSame('some bytes', file_get_contents($writtenPath));
    }

    public function testPhotoPathGuardAllowsLegitimateDeeplyNestedFilePath(): void
    {
        // Regression test for the PhotoPathGuard retrofit: a legitimate,
        // backend-computed file_path several directories deep must still
        // resolve within photosPath and be written successfully, not be
        // rejected as if it were escaping the root.
        $filePath = 'users/1/items/42/photos/nested/deep/photo.jpg';
        $httpClient = new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
            ['body' => '{}', 'httpCode' => 200, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);
        $uploadedFile = $this->buildUploadedFile('photo.jpg', 'nested bytes');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile));

        $this->assertSame(200, $response->httpCode());

        $writtenPath = $this->photosPath . '/' . $filePath;
        $this->assertFileExists($writtenPath);
        $this->assertSame('nested bytes', file_get_contents($writtenPath));
    }

    private function buildHandler(FakeHttpClient $httpClient, int $maxUploadSizeBytes = 1_048_576): PhotoSubmitRequestHandler
    {
        return new PhotoSubmitRequestHandler(
            'http://backend:3000',
            $this->photosPath,
            $maxUploadSizeBytes,
            ['jpg', 'jpeg', 'png'],
            $httpClient
        );
    }

    private function buildUploadedFile(string $name, string $contents): array
    {
        $tmpName = tempnam(sys_get_temp_dir(), 'photo_submit_upload_');
        file_put_contents($tmpName, $contents);

        return [
            'name' => $name,
            'type' => 'application/octet-stream',
            'tmp_name' => $tmpName,
            'error' => UPLOAD_ERR_OK,
            'size' => strlen($contents)
        ];
    }

    private function buildRequest(array $uploadedFile, ?string $cookie = null): ProcessingRequest
    {
        $headers = $cookie !== null ? ['Cookie' => $cookie] : [];

        return new ProcessingRequest([
            'requestMethod' => 'POST',
            'requestPath' => self::SUBMIT_PATH,
            'headers' => $headers,
            'uploadedFiles' => ['file' => $uploadedFile],
            'postFields' => []
        ]);
    }

    private function removeDirRecursive(string $dir): void
    {
        if (!is_dir($dir)) {
            return;
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($files as $file) {
            if ($file->isFile() || $file->isLink()) {
                unlink($file->getPathname());
            } else {
                rmdir($file->getPathname());
            }
        }

        rmdir($dir);
    }
}

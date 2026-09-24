<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';
require_once __DIR__ . '/PhotoRequestHandlerTestCase.php';

use Oak\Proxy\PhotoSubmitRequestHandler;
use Tent\Models\ProcessingRequest;

class PhotoSubmitRequestHandlerTest extends PhotoRequestHandlerTestCase
{
    private const SUBMIT_PATH = '/uploads/categories/miniatures/items/42/photos/7/submit';

    protected function tempDirPrefix(): string
    {
        return 'photo_submit_test_';
    }

    public function testRejectsDisallowedExtensionWithoutCallingBackendOrWriting(): void
    {
        $httpClient = new FakeHttpClient();
        $handler = $this->buildHandler($httpClient);
        $uploadedFile = $this->buildUploadedFile('photo.txt', 'not a photo');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile));

        $this->assertSame(415, $response->httpCode());
        $this->assertSame([], $httpClient->calls);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testRejectsOversizedUploadWithoutCallingBackendOrWriting(): void
    {
        $httpClient = new FakeHttpClient();
        $handler = $this->buildHandler($httpClient, 4);
        $uploadedFile = $this->buildUploadedFile('photo.jpg', 'way too large for the limit');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile));

        $this->assertSame(413, $response->httpCode());
        $this->assertSame([], $httpClient->calls);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
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
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testHappyPathGatesWritesAllVersionsAndFinalizes(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $httpClient = $this->successfulClient($filePath);
        $handler = $this->buildHandler($httpClient);
        $uploadedFile = $this->buildImageUpload('photo.jpg', 2000, 1500);
        $originalBytes = file_get_contents($uploadedFile['tmp_name']);

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

        $originPath = $this->storageRoot . '/origin/' . $filePath;
        $this->assertFileExists($originPath);
        $this->assertSame($originalBytes, file_get_contents($originPath));

        $this->assertSame([800, 600, IMAGETYPE_JPEG], $this->imageInfo($this->storageRoot . '/photos/' . $filePath));
        $this->assertSame([215, 161, IMAGETYPE_JPEG], $this->imageInfo($this->storageRoot . '/snaps/' . $filePath));
    }

    public function testHappyPathWritesAllPngVersions(): void
    {
        $filePath = 'users/1/items/42/photo.png';
        $httpClient = $this->successfulClient($filePath);
        $handler = $this->buildHandler($httpClient);

        $response = $handler->handleRequest($this->buildRequest($this->buildImageUpload('photo.png', 1500, 2000)));

        $this->assertSame(200, $response->httpCode());
        $this->assertCount(2, $httpClient->calls);

        $this->assertSame([1500, 2000, IMAGETYPE_PNG], $this->imageInfo($this->storageRoot . '/origin/' . $filePath));
        $this->assertSame([798, 1064, IMAGETYPE_PNG], $this->imageInfo($this->storageRoot . '/photos/' . $filePath));
        $this->assertSame([161, 215, IMAGETYPE_PNG], $this->imageInfo($this->storageRoot . '/snaps/' . $filePath));
    }

    public function testTallImageKeepsItsAspectRatio(): void
    {
        $filePath = 'users/1/items/42/tall.jpg';
        $handler = $this->buildHandler($this->successfulClient($filePath));

        $response = $handler->handleRequest($this->buildRequest($this->buildImageUpload('tall.jpg', 800, 2128)));

        $this->assertSame(200, $response->httpCode());
        $this->assertSame([400, 1064, IMAGETYPE_JPEG], $this->imageInfo($this->storageRoot . '/photos/' . $filePath));
        $this->assertSame([81, 215, IMAGETYPE_JPEG], $this->imageInfo($this->storageRoot . '/snaps/' . $filePath));
    }

    public function testSmallImageIsNotUpscaled(): void
    {
        $filePath = 'users/1/items/42/small.jpg';
        $handler = $this->buildHandler($this->successfulClient($filePath));

        $response = $handler->handleRequest($this->buildRequest($this->buildImageUpload('small.jpg', 100, 80)));

        $this->assertSame(200, $response->httpCode());
        $this->assertSame([100, 80, IMAGETYPE_JPEG], $this->imageInfo($this->storageRoot . '/photos/' . $filePath));
        $this->assertSame([100, 80, IMAGETYPE_JPEG], $this->imageInfo($this->storageRoot . '/snaps/' . $filePath));
    }

    public function testResizeFailureRemovesEveryFileAndDoesNotFinalize(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $httpClient = $this->successfulClient($filePath);
        $handler = $this->buildHandler($httpClient);
        $uploadedFile = $this->buildUploadedFile('photo.jpg', 'not really a jpeg');
        $log = $this->captureErrorLog();

        try {
            $response = $handler->handleRequest($this->buildRequest($uploadedFile));
        } finally {
            $logged = $this->restoreErrorLog($log);
        }

        $this->assertSame(502, $response->httpCode());
        $this->assertSame('{"error":"Failed to resize uploaded file"}', $response->body());
        $this->assertCount(1, $httpClient->calls);
        $this->assertSame('{"status":"uploading"}', $httpClient->calls[0]['body']);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
        $this->assertStringContainsString('photo 7', $logged);
        $this->assertStringContainsString($filePath, $logged);
    }

    public function testRejectsFilePathEscapingThePrefixFolder(): void
    {
        $filePath = '../escape.jpg';
        $httpClient = $this->successfulClient($filePath);
        $handler = $this->buildHandler($httpClient);
        $log = $this->captureErrorLog();

        try {
            $response = $handler->handleRequest($this->buildRequest($this->buildImageUpload('photo.jpg', 300, 200)));
        } finally {
            $this->restoreErrorLog($log);
        }

        $this->assertSame(502, $response->httpCode());
        $this->assertSame('{"error":"Failed to store uploaded file"}', $response->body());
        $this->assertCount(1, $httpClient->calls);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testPhotoPathGuardAllowsLegitimateDeeplyNestedFilePath(): void
    {
        // Regression test for the PhotoPathGuard retrofit: a legitimate,
        // backend-computed file_path several directories deep must still
        // resolve within each prefix folder and be written successfully, not
        // be rejected as if it were escaping the root.
        $filePath = 'users/1/items/42/photos/nested/deep/photo.jpg';
        $handler = $this->buildHandler($this->successfulClient($filePath));

        $response = $handler->handleRequest($this->buildRequest($this->buildImageUpload('photo.jpg', 300, 200)));

        $this->assertSame(200, $response->httpCode());

        foreach (['origin', 'photos', 'snaps'] as $prefix) {
            $this->assertFileExists($this->storageRoot . '/' . $prefix . '/' . $filePath);
        }
    }

    private function successfulClient(string $filePath): FakeHttpClient
    {
        return new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
            ['body' => '{}', 'httpCode' => 200, 'headers' => []]
        ]);
    }

    /**
     * Points `error_log` at a temp file; returns [temp file, previous setting].
     */
    private function captureErrorLog(): array
    {
        $logFile = tempnam(sys_get_temp_dir(), 'photo_submit_log_');

        return [$logFile, ini_set('error_log', $logFile)];
    }

    /**
     * Restores `error_log` and returns what was logged meanwhile.
     */
    private function restoreErrorLog(array $log): string
    {
        [$logFile, $previous] = $log;
        ini_set('error_log', $previous === false ? '' : $previous);
        $logged = (string) file_get_contents($logFile);
        unlink($logFile);

        return $logged;
    }

    private function buildHandler(FakeHttpClient $httpClient, int $maxUploadSizeBytes = 1_048_576): PhotoSubmitRequestHandler
    {
        return new PhotoSubmitRequestHandler(
            'http://backend:3000',
            $this->storageRoot,
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
}

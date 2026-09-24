<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoSubmitRequestHandlerTestCase.php';

class PhotoSubmitRequestHandlerStorageTest extends PhotoSubmitRequestHandlerTestCase
{
    protected function tempDirPrefix(): string
    {
        return 'photo_submit_storage_test_';
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
}

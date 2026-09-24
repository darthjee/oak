<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/ErrorLogCapture.php';
require_once __DIR__ . '/PhotoRequestHandlerTestCase.php';

use Oak\Proxy\PhotoImageResizer;
use Oak\Proxy\PhotoPathGuard;
use Oak\Proxy\PhotoVersionStorer;

class PhotoVersionStorerTest extends PhotoRequestHandlerTestCase
{
    use ErrorLogCapture;

    private PhotoVersionStorer $storer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->storer = new PhotoVersionStorer($this->storageRoot, new PhotoPathGuard(), new PhotoImageResizer());
    }

    protected function tempDirPrefix(): string
    {
        return 'photo_version_storer_test_';
    }

    public function testStoresTheOriginalAndBothResizedVersions(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $tmpName = $this->buildImageUpload('photo.jpg', 2000, 1500)['tmp_name'];
        $originalBytes = file_get_contents($tmpName);

        $this->assertNull($this->storer->store($tmpName, $filePath, '7'));

        $this->assertSame($originalBytes, file_get_contents($this->storageRoot . '/origin/' . $filePath));
        $this->assertSame([800, 600, IMAGETYPE_JPEG], $this->imageInfo($this->storageRoot . '/photos/' . $filePath));
        $this->assertSame([215, 161, IMAGETYPE_JPEG], $this->imageInfo($this->storageRoot . '/snaps/' . $filePath));
    }

    public function testStoresADeeplyNestedFilePath(): void
    {
        $filePath = 'users/1/items/42/photos/nested/deep/photo.jpg';
        $tmpName = $this->buildImageUpload('photo.jpg', 300, 200)['tmp_name'];

        $this->assertNull($this->storer->store($tmpName, $filePath, '7'));

        foreach (['origin', 'photos', 'snaps'] as $prefix) {
            $this->assertFileExists($this->storageRoot . '/' . $prefix . '/' . $filePath);
        }
    }

    public function testRejectsAFilePathEscapingThePrefixFolder(): void
    {
        $tmpName = $this->buildImageUpload('photo.jpg', 300, 200)['tmp_name'];
        $log = $this->captureErrorLog();

        try {
            $error = $this->storer->store($tmpName, '../escape.jpg', '7');
        } finally {
            $this->restoreErrorLog($log);
            unlink($tmpName);
        }

        $this->assertSame('Failed to store uploaded file', $error);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testRollsBackEveryFileWhenTheResizeFails(): void
    {
        $filePath = 'users/1/items/42/photo.jpg';
        $tmpName = tempnam(sys_get_temp_dir(), 'photo_version_storer_upload_');
        file_put_contents($tmpName, 'not really a jpeg');
        $log = $this->captureErrorLog();

        try {
            $error = $this->storer->store($tmpName, $filePath, '7');
        } finally {
            $logged = $this->restoreErrorLog($log);
        }

        $this->assertSame('Failed to resize uploaded file', $error);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
        $this->assertStringContainsString('photo 7', $logged);
        $this->assertStringContainsString($filePath, $logged);
    }
}

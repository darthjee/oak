<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/ErrorLogCapture.php';
require_once __DIR__ . '/PhotoRequestHandlerTestCase.php';
require_once __DIR__ . '/PhotoVersionFixtures.php';

use Oak\Proxy\PhotoFileDeleter;
use Oak\Proxy\PhotoPathGuard;

class PhotoFileDeleterTest extends PhotoRequestHandlerTestCase
{
    use ErrorLogCapture;
    use PhotoVersionFixtures;

    private const FILE_PATH = 'users/1/items/42/photo.jpg';

    private PhotoFileDeleter $deleter;

    /** @var array The value returned by captureErrorLog(). */
    private array $log;

    protected function setUp(): void
    {
        parent::setUp();

        // The deleter logs every skipped version; keep the test output clean.
        $this->log = $this->captureErrorLog();
        $this->deleter = new PhotoFileDeleter($this->storageRoot, new PhotoPathGuard());
    }

    protected function tearDown(): void
    {
        $this->restoreErrorLog($this->log);

        parent::tearDown();
    }

    protected function tempDirPrefix(): string
    {
        return 'photo_file_deleter_test_';
    }

    public function testDeletesAllThreeVersions(): void
    {
        $this->writeVersions(self::FILE_PATH);

        $this->deleter->delete(self::FILE_PATH);

        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testDeletesOnlyTheVersionsPresent(): void
    {
        $this->writeVersions(self::FILE_PATH, ['origin']);

        $this->deleter->delete(self::FILE_PATH);

        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testAlreadyMissingFileIsANoOpAndCreatesNoDirectories(): void
    {
        $this->deleter->delete(self::FILE_PATH);

        $this->assertSame(['.', '..'], scandir($this->storageRoot));
    }

    public function testFilePathEscapingThePrefixFoldersDeletesNothingOutsideThem(): void
    {
        $this->writeVersions('escape.jpg', ['']);
        $this->writeVersions(self::FILE_PATH);

        $this->deleter->delete('../escape.jpg');

        $this->assertFileExists($this->storageRoot . '/escape.jpg');
        $this->assertCount(4, $this->filesUnder($this->storageRoot));
    }
}

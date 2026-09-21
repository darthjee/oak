<?php

namespace Oak\Proxy\Tests;

use PHPUnit\Framework\TestCase;

/**
 * Shared fixture setup for the photo upload/delete handler tests: creates a
 * per-test temp `photosPath` directory before each test and removes it
 * afterward.
 */
abstract class PhotoRequestHandlerTestCase extends TestCase
{
    protected string $photosPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->photosPath = sys_get_temp_dir() . '/' . $this->tempDirPrefix() . uniqid();
        mkdir($this->photosPath, 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirRecursive($this->photosPath);

        parent::tearDown();
    }

    /**
     * The temp directory prefix used to build this test class's `photosPath`.
     *
     * @return string
     */
    abstract protected function tempDirPrefix(): string;

    protected function removeDirRecursive(string $dir): void
    {
        if (is_dir($dir) === FALSE) {
            return;
        }

        $files = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS),
            \RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($files as $file) {
            if ($file->isFile() === TRUE || $file->isLink() === TRUE) {
                unlink($file->getPathname());
            } else {
                rmdir($file->getPathname());
            }
        }

        rmdir($dir);
    }
}

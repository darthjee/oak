<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoImageFixtures.php';

use PHPUnit\Framework\TestCase;

/**
 * Shared fixture setup for the photo upload/delete handler tests: creates a
 * per-test temp `storageRoot` directory before each test and removes it
 * afterward.
 */
abstract class PhotoRequestHandlerTestCase extends TestCase
{
    use PhotoImageFixtures;

    protected string $storageRoot;

    protected function setUp(): void
    {
        parent::setUp();

        $this->storageRoot = sys_get_temp_dir() . '/' . $this->tempDirPrefix() . uniqid();
        mkdir($this->storageRoot, 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirRecursive($this->storageRoot);

        parent::tearDown();
    }

    /**
     * The temp directory prefix used to build this test class's `storageRoot`.
     *
     * @return string
     */
    abstract protected function tempDirPrefix(): string;

    /**
     * Builds an uploaded-file entry (as in `$request->uploadedFiles()`)
     * whose temp file is a GD-made image.
     *
     * @param string  $name   The uploaded file's original name; its extension
     *   picks the format (png, otherwise jpeg).
     * @param integer $width  Image width.
     * @param integer $height Image height.
     * @return array
     */
    protected function buildImageUpload(string $name, int $width, int $height): array
    {
        $tmpName = tempnam(sys_get_temp_dir(), 'photo_image_upload_');

        if (strtolower(pathinfo($name, PATHINFO_EXTENSION)) === 'png') {
            $this->makePng($tmpName, $width, $height);
        } else {
            $this->makeJpeg($tmpName, $width, $height);
        }

        return [
            'name' => $name,
            'type' => 'application/octet-stream',
            'tmp_name' => $tmpName,
            'error' => UPLOAD_ERR_OK,
            'size' => filesize($tmpName)
        ];
    }

    /**
     * Lists every file (not directory) under `$dir`, relative to it.
     *
     * @param string $dir Directory to list.
     * @return string[]
     */
    protected function filesUnder(string $dir): array
    {
        if (is_dir($dir) === FALSE) {
            return [];
        }

        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            $files[] = substr($file->getPathname(), strlen($dir) + 1);
        }

        sort($files);

        return $files;
    }

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

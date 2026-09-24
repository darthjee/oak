<?php

namespace Oak\Proxy\Tests;

/**
 * Seeds and lists the `origin/`, `photos/` and `snaps/` versions of a photo
 * under `$this->storageRoot`, for the photo delete tests.
 */
trait PhotoVersionFixtures
{
    /**
     * Seeds `<storageRoot>/<prefix>/<filePath>` for each given prefix.
     *
     * @param string   $filePath The file path, relative to each prefix folder.
     * @param string[] $prefixes The prefix folders to seed ('' seeds storageRoot itself).
     * @return void
     */
    protected function writeVersions(string $filePath, array $prefixes = ['origin', 'photos', 'snaps']): void
    {
        foreach ($prefixes as $prefix) {
            $destination = rtrim($this->storageRoot . '/' . $prefix, '/') . '/' . $filePath;
            $dir = dirname($destination);

            if (is_dir($dir) === FALSE) {
                mkdir($dir, 0775, true);
            }

            file_put_contents($destination, 'bytes');
        }
    }

    /**
     * The sorted, storageRoot-relative paths of every version of `$filePath`.
     *
     * @param string $filePath The file path, relative to each prefix folder.
     * @return string[]
     */
    protected function versionPaths(string $filePath): array
    {
        return array_map(fn ($prefix) => $prefix . '/' . $filePath, ['origin', 'photos', 'snaps']);
    }
}

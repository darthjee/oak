<?php

namespace Oak\Proxy;

/**
 * Deletes photo files from disk on behalf of `PhotoDeleteRequestHandler`,
 * keeping the handler free of filesystem concerns — mirroring how
 * `PhotoPathGuard` was already split out for path-safety.
 */
class PhotoFileDeleter
{
    /** @var string Local filesystem base path backing `Settings.photos_path`. */
    private string $photosPath;

    /** @var PhotoPathGuard Guards the unlink target against path traversal/escapes. */
    private PhotoPathGuard $pathGuard;

    /**
     * @param string        $photosPath Local filesystem base path for photos.
     * @param PhotoPathGuard $pathGuard Guards the unlink target against path traversal/escapes.
     */
    public function __construct(string $photosPath, PhotoPathGuard $pathGuard)
    {
        $this->photosPath = rtrim($photosPath, '/');
        $this->pathGuard = $pathGuard;
    }

    /**
     * Deletes `<photosPath>/<filePath>` from disk, if it exists.
     *
     * Does not create any directories — unlike Submit's write path, the
     * destination directory is expected to already exist for a `ready`
     * photo. A missing file (or a path the guard rejects as unsafe) is
     * logged and treated as a harmless no-op, never an error.
     *
     * @param string $filePath The file path to delete, relative to photosPath.
     * @return void
     */
    public function delete(string $filePath): void
    {
        $destinationDir = dirname(rtrim($this->photosPath, '/') . '/' . ltrim($filePath, '/'));

        if (is_dir($destinationDir) === FALSE) {
            error_log(sprintf(
                'PhotoDeleteRequestHandler: destination directory for file_path "%s" does not exist, ' .
                    'treating as already missing',
                $filePath
            ));

            return;
        }

        $safeDestination = $this->pathGuard->resolve($this->photosPath, $filePath);

        if ($safeDestination === null) {
            error_log(sprintf(
                'PhotoDeleteRequestHandler: rejected unsafe file_path "%s" under photosPath "%s"',
                $filePath,
                $this->photosPath
            ));

            return;
        }

        if (file_exists($safeDestination) === FALSE) {
            error_log(sprintf(
                'PhotoDeleteRequestHandler: file already missing at "%s", skipping unlink',
                $safeDestination
            ));

            return;
        }

        unlink($safeDestination);
    }
}

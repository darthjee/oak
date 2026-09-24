<?php

namespace Oak\Proxy;

/**
 * Deletes photo files from disk on behalf of `PhotoDeleteRequestHandler`,
 * keeping the handler free of filesystem concerns — mirroring how
 * `PhotoPathGuard` was already split out for path-safety.
 *
 * Every photo has up to three versions under `storageRoot`: `origin/`,
 * `photos/` and `snaps/`; all of them are removed.
 */
class PhotoFileDeleter
{
    /** Folders, under storageRoot, holding each version of a photo. */
    private const PREFIXES = ['origin', 'photos', 'snaps'];

    /** @var string Local filesystem root holding the `origin/`, `photos/` and `snaps/` folders. */
    private string $storageRoot;

    /** @var PhotoPathGuard Guards the unlink target against path traversal/escapes. */
    private PhotoPathGuard $pathGuard;

    /**
     * @param string         $storageRoot Root holding origin/, photos/ and snaps/.
     * @param PhotoPathGuard $pathGuard   Guards the unlink target against path traversal/escapes.
     */
    public function __construct(string $storageRoot, PhotoPathGuard $pathGuard)
    {
        $this->storageRoot = rtrim($storageRoot, '/');
        $this->pathGuard = $pathGuard;
    }

    /**
     * Deletes `<storageRoot>/<prefix>/<filePath>` for every prefix, if it
     * exists.
     *
     * Does not create any directories. A missing file (or a path the guard
     * rejects as unsafe) is logged and skipped for that prefix only, never
     * an error.
     *
     * @param string $filePath The file path to delete, relative to each prefix folder.
     * @return void
     */
    public function delete(string $filePath): void
    {
        foreach (self::PREFIXES as $prefix) {
            $this->deleteUnder($this->storageRoot . '/' . $prefix, $filePath);
        }
    }

    /**
     * Deletes `<root>/<filePath>` from disk, if it exists.
     *
     * @param string $root     The prefix folder used as the guard root.
     * @param string $filePath The file path to delete, relative to `$root`.
     * @return void
     */
    private function deleteUnder(string $root, string $filePath): void
    {
        $destinationDir = dirname($root . '/' . ltrim($filePath, '/'));

        if (is_dir($destinationDir) === FALSE) {
            error_log(sprintf(
                'PhotoDeleteRequestHandler: destination directory for file_path "%s" under "%s" does not exist, ' .
                    'treating as already missing',
                $filePath,
                $root
            ));

            return;
        }

        $safeDestination = $this->pathGuard->resolve($root, $filePath);

        if ($safeDestination === null) {
            error_log(sprintf(
                'PhotoDeleteRequestHandler: rejected unsafe file_path "%s" under "%s"',
                $filePath,
                $root
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

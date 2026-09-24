<?php

namespace Oak\Proxy;

/**
 * Writes the three files of the photo Submit flow under `storageRoot`:
 *
 * - `origin/<file_path>`: the uploaded bytes, as is;
 * - `photos/<file_path>`: a copy that fits within 800x1064;
 * - `snaps/<file_path>`: a copy that fits within 215x215.
 *
 * Every destination goes through `PhotoPathGuard` with its prefix folder as
 * the root. If any write or resize fails, every file already written for
 * this upload (origin included) is removed and the failure is logged with
 * the photo id and `file_path`.
 */
class PhotoVersionStorer
{
    /** Folder, under storageRoot, holding the uploaded original. */
    private const ORIGIN_PREFIX = 'origin';

    /**
     * Resized versions: folder under storageRoot => [max width, max height].
     * Mirrors `prod_public_files/convert.sh` (`-resize 800x1064>` / `215x215>`).
     */
    private const VERSIONS = [
        'photos' => [800, 1064],
        'snaps' => [215, 215]
    ];

    /** @var string Local filesystem root holding the `origin/`, `photos/` and `snaps/` folders. */
    private string $storageRoot;

    /** @var PhotoPathGuard Guards the write destination against path traversal/escapes. */
    private PhotoPathGuard $pathGuard;

    /** @var PhotoImageResizer Makes the resized `photos/` and `snaps/` versions. */
    private PhotoImageResizer $resizer;

    /**
     * @param string            $storageRoot Root holding origin/, photos/ and snaps/.
     * @param PhotoPathGuard    $pathGuard   Guards destinations against path traversal/escapes.
     * @param PhotoImageResizer $resizer     Makes the resized versions.
     */
    public function __construct(string $storageRoot, PhotoPathGuard $pathGuard, PhotoImageResizer $resizer)
    {
        $this->storageRoot = rtrim($storageRoot, '/');
        $this->pathGuard = $pathGuard;
        $this->resizer = $resizer;
    }

    /**
     * Writes `origin/`, `photos/` and `snaps/` for `$filePath`, rolling back
     * every file already written if any step fails.
     *
     * @param string $tmpName  The uploaded file's temporary path.
     * @param string $filePath The destination path, relative to each prefix folder.
     * @param string $photoId  The photo id (for logging).
     * @return string|null The client-facing error message on failure, null on success.
     */
    public function store(string $tmpName, string $filePath, string $photoId): ?string
    {
        $origin = $this->destination(self::ORIGIN_PREFIX, $filePath);

        if ($origin === null || $this->moveUpload($tmpName, $origin) === FALSE) {
            $this->rollBack([], $photoId, $filePath, self::ORIGIN_PREFIX);

            return 'Failed to store uploaded file';
        }

        $written = [$origin];

        foreach (self::VERSIONS as $prefix => [$maxWidth, $maxHeight]) {
            $destination = $this->destination($prefix, $filePath);
            $written[] = $destination;
            $resized = $destination !== null
                && $this->resizer->resize($origin, $destination, $maxWidth, $maxHeight);

            if ($resized === FALSE) {
                $this->rollBack($written, $photoId, $filePath, $prefix);

                return 'Failed to resize uploaded file';
            }
        }

        return null;
    }

    /**
     * Removes the given files and logs the failure.
     *
     * @param array<string|null> $written  Files written (or partly written) for this upload.
     * @param string             $photoId  The photo id.
     * @param string             $filePath The backend-provided file path.
     * @param string             $step     The prefix folder whose write failed.
     * @return void
     */
    private function rollBack(array $written, string $photoId, string $filePath, string $step): void
    {
        foreach ($written as $path) {
            if ($path !== null && is_file($path) === TRUE) {
                unlink($path);
            }
        }

        error_log(sprintf(
            'PhotoSubmitRequestHandler: failed to write "%s" for photo %s, file_path "%s"; upload rolled back',
            $step,
            $photoId,
            $filePath
        ));
    }

    /**
     * Resolves `<storageRoot>/<prefix>/<filePath>`, creating the prefix folder
     * and the file's parent directories as needed.
     *
     * The destination is routed through `PhotoPathGuard` with
     * `<storageRoot>/<prefix>` as the root, so a `..` segment or symlink
     * escape in `filePath` is rejected instead of leaving the prefix folder.
     *
     * @param string $prefix   The prefix folder (origin, photos or snaps).
     * @param string $filePath The destination path, relative to the prefix folder.
     * @return string|null The safe destination path, or null if rejected.
     */
    private function destination(string $prefix, string $filePath): ?string
    {
        $root = $this->storageRoot . '/' . $prefix;
        $dir = dirname($root . '/' . ltrim($filePath, '/'));

        foreach ([$root, $dir] as $path) {
            if (is_dir($path) === FALSE) {
                @mkdir($path, 0775, true);
            }
        }

        return $this->pathGuard->resolve($root, $filePath);
    }

    /**
     * Moves the uploaded file to `$destination`.
     *
     * @param string $tmpName     The uploaded file's temporary path.
     * @param string $destination The safe destination path.
     * @return boolean
     */
    private function moveUpload(string $tmpName, string $destination): bool
    {
        if (is_uploaded_file($tmpName) === TRUE) {
            return move_uploaded_file($tmpName, $destination);
        }

        return @rename($tmpName, $destination);
    }
}

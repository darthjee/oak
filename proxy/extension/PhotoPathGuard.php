<?php

namespace Oak\Proxy;

/**
 * Shared path-containment guard used by the photo upload/delete handlers.
 *
 * Resolves a backend-provided `file_path` (relative to `photosPath`) to its
 * real, absolute filesystem path and confirms that path is actually
 * contained within `photosPath` before a caller writes to or unlinks it.
 * This is defense-in-depth against path traversal (`..` segments) or
 * symlink escapes — `file_path` is backend-computed today, not
 * attacker-controlled, but callers must never write/unlink outside
 * `photosPath` even if that ever changes.
 */
class PhotoPathGuard
{
    /**
     * Expected shape of a backend-provided photo path, relative to a kind
     * folder: `users/<digits>/items/<digits>/<file_name>`.
     */
    private const PHOTO_PATH_PATTERN = '#^users/\d+/items/\d+/(?<file_name>[^/]+)$#D';

    /**
     * Checks that `$path` has the strict `users/<uid>/items/<item_id>/<file_name>`
     * shape.
     *
     * The file-name segment must be non-empty and contain no `/`, no `..`
     * and no NUL byte; spaces and accented characters are allowed (legacy
     * names may contain them). Absolute paths are rejected.
     *
     * @param string $path The path to check, relative to a kind folder.
     * @return boolean
     */
    public function isValidPhotoPath(string $path): bool
    {
        if (preg_match(self::PHOTO_PATH_PATTERN, $path, $matches) !== 1) {
            return false;
        }

        $fileName = $matches['file_name'];

        return $fileName !== '.'
            && strpos($fileName, '..') === false
            && strpos($fileName, "\0") === false;
    }

    /**
     * Resolves `<photosPath>/<filePath>` and confirms the result stays
     * contained within `photosPath`.
     *
     * The destination's parent directory must already exist — this guard
     * never creates directories itself; callers that need the directory
     * created (e.g. on write) must do so before calling this method.
     *
     * @param string $photosPath Local filesystem base path for photos.
     * @param string $filePath   The destination path, relative to photosPath.
     * @return string|null The resolved, safe absolute destination path, or
     *   `null` if either real path cannot be resolved, or the resolved
     *   destination directory does not stay within `photosPath`.
     */
    public function resolve(string $photosPath, string $filePath): ?string
    {
        $destination = rtrim($photosPath, '/') . '/' . ltrim($filePath, '/');
        $dir = dirname($destination);

        $realDir = realpath($dir);
        $realRoot = realpath($photosPath);

        if ($realDir === false || $realRoot === false) {
            return null;
        }

        if ($this->isContained($realDir, $realRoot) === FALSE) {
            return null;
        }

        return $realDir . '/' . basename($destination);
    }

    /**
     * Checks whether `$realDir` is `$realRoot` itself or a descendant of it.
     *
     * @param string $realDir  The resolved candidate directory.
     * @param string $realRoot The resolved root directory.
     * @return boolean
     */
    private function isContained(string $realDir, string $realRoot): bool
    {
        return $realDir === $realRoot || strpos($realDir, $realRoot . DIRECTORY_SEPARATOR) === 0;
    }
}

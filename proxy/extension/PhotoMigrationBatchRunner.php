<?php

namespace Oak\Proxy;

/**
 * Classifies and migrates one batch of photos returned by the backend's
 * `prepare` call, on behalf of `PhotoMigrationRequestHandler`.
 *
 * Every entry is validated first (int `id`, `legacy_path`/`file_path` with
 * the strict `users/<uid>/items/<item_id>/<file_name>` shape); valid entries
 * are handed to `PhotoFileMover` and their ids collected into `migrated`,
 * `missing` or `failed`.
 */
class PhotoMigrationBatchRunner
{
    /** @var PhotoPathGuard Validates the backend-provided paths' shape. */
    private PhotoPathGuard $pathGuard;

    /** @var PhotoFileMover Moves each photo's files. */
    private PhotoFileMover $fileMover;

    /**
     * @param PhotoPathGuard $pathGuard Validates the backend-provided paths' shape.
     * @param PhotoFileMover $fileMover Moves each photo's files.
     */
    public function __construct(PhotoPathGuard $pathGuard, PhotoFileMover $fileMover)
    {
        $this->pathGuard = $pathGuard;
        $this->fileMover = $fileMover;
    }

    /**
     * Migrates every photo of the batch.
     *
     * @param array $photos The `photos` entries of the `prepare` response.
     * @return array{migrated: int[], missing: int[], failed: array<array{id: int, reason: string}>}
     */
    public function run(array $photos): array
    {
        $result = ['migrated' => [], 'missing' => [], 'failed' => []];

        foreach ($photos as $photo) {
            if (is_array($photo) === FALSE || is_int($photo['id'] ?? null) === FALSE) {
                error_log('PhotoMigrationRequestHandler: skipping photo entry without an integer id');

                continue;
            }

            $outcome = $this->migratePhoto($photo);

            if ($outcome['status'] === PhotoFileMover::FAILED) {
                $result['failed'][] = ['id' => $photo['id'], 'reason' => $outcome['reason']];

                continue;
            }

            $result[$outcome['status']][] = $photo['id'];
        }

        return $result;
    }

    /**
     * Validates one photo entry's paths and migrates its files.
     *
     * @param array $photo One `photos` entry of the `prepare` response.
     * @return array{status: string, reason: string|null}
     */
    private function migratePhoto(array $photo): array
    {
        $legacyPath = $photo['legacy_path'] ?? null;
        $filePath = $photo['file_path'] ?? null;

        if ($this->isValidPath($legacyPath) === FALSE || $this->isValidPath($filePath) === FALSE) {
            error_log(sprintf('PhotoMigrationRequestHandler: invalid path for photo %d', $photo['id']));

            return ['status' => PhotoFileMover::FAILED, 'reason' => 'invalid path'];
        }

        return $this->fileMover->migrate($legacyPath, $filePath);
    }

    /**
     * Checks that a backend-provided path is a string with the expected shape.
     *
     * @param mixed $path The path to check.
     * @return boolean
     */
    private function isValidPath(mixed $path): bool
    {
        return is_string($path) && $this->pathGuard->isValidPhotoPath($path);
    }
}

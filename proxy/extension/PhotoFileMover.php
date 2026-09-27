<?php

namespace Oak\Proxy;

/**
 * Moves a legacy photo's files to their backend-assigned names on behalf of
 * `PhotoMigrationRequestHandler`, keeping the handler free of filesystem
 * concerns (mirroring `PhotoFileDeleter`).
 *
 * Every photo has two migrated versions: `photos/` and `snaps/`. For each of
 * them the file is moved from `<legacyRoot>/<kind>/<legacyPath>` to
 * `<storageRoot>/<kind>/<filePath>`. `origin/` is not migrated.
 */
class PhotoFileMover
{
    /** Result status: every kind is at its new name. */
    public const MIGRATED = 'migrated';

    /** Result status: at least one kind is absent at both locations. */
    public const MISSING = 'missing';

    /** Result status: a mkdir/guard/rename step failed. */
    public const FAILED = 'failed';

    /** Folders, under each root, holding the migrated versions of a photo. */
    private const KINDS = ['photos', 'snaps'];

    /** @var string Local filesystem root holding the legacy `photos/` and `snaps/` folders. */
    private string $legacyRoot;

    /** @var string Local filesystem root holding the new `photos/` and `snaps/` folders. */
    private string $storageRoot;

    /** @var PhotoPathGuard Guards both rename ends against path traversal/escapes. */
    private PhotoPathGuard $pathGuard;

    /**
     * @param string         $legacyRoot  Root holding the legacy photos/ and snaps/.
     * @param string         $storageRoot Root holding the new photos/ and snaps/.
     * @param PhotoPathGuard $pathGuard   Guards both rename ends against path traversal/escapes.
     */
    public function __construct(string $legacyRoot, string $storageRoot, PhotoPathGuard $pathGuard)
    {
        $this->legacyRoot = rtrim($legacyRoot, '/');
        $this->storageRoot = rtrim($storageRoot, '/');
        $this->pathGuard = $pathGuard;
    }

    /**
     * Migrates the `photos/` and `snaps/` files of one photo.
     *
     * Every kind is pre-checked first: if any of them is absent both at the
     * legacy path and at the target, the photo is `missing` and nothing is
     * touched. Otherwise each kind still at its legacy path is renamed to
     * its target (an existing target is overwritten); a kind already at its
     * target counts as done.
     *
     * @param string $legacyPath The legacy path, relative to each kind folder.
     * @param string $filePath   The new path, relative to each kind folder.
     * @return array{status: string, reason: string|null}
     */
    public function migrate(string $legacyPath, string $filePath): array
    {
        foreach (self::KINDS as $kind) {
            if ($this->isPresent($kind, $legacyPath, $filePath) === FALSE) {
                error_log(sprintf(
                    'PhotoMigrationRequestHandler: "%s" file missing for legacy_path "%s" / file_path "%s"',
                    $kind,
                    $legacyPath,
                    $filePath
                ));

                return ['status' => self::MISSING, 'reason' => null];
            }
        }

        foreach (self::KINDS as $kind) {
            $reason = $this->moveKind($kind, $legacyPath, $filePath);

            if ($reason !== null) {
                error_log(sprintf(
                    'PhotoMigrationRequestHandler: %s moving "%s" legacy_path "%s" to file_path "%s"',
                    $reason,
                    $kind,
                    $legacyPath,
                    $filePath
                ));

                return ['status' => self::FAILED, 'reason' => $reason];
            }
        }

        return ['status' => self::MIGRATED, 'reason' => null];
    }

    /**
     * Checks whether the kind's file exists at the legacy path or the target.
     *
     * @param string $kind       The kind folder (photos or snaps).
     * @param string $legacyPath The legacy path, relative to the kind folder.
     * @param string $filePath   The new path, relative to the kind folder.
     * @return boolean
     */
    private function isPresent(string $kind, string $legacyPath, string $filePath): bool
    {
        return is_file($this->legacyFile($kind, $legacyPath))
            || is_file($this->targetFile($kind, $filePath));
    }

    /**
     * Moves one kind's file from its legacy path to its target, if it is
     * still at its legacy path.
     *
     * @param string $kind       The kind folder (photos or snaps).
     * @param string $legacyPath The legacy path, relative to the kind folder.
     * @param string $filePath   The new path, relative to the kind folder.
     * @return string|null The failure reason, or null on success.
     */
    private function moveKind(string $kind, string $legacyPath, string $filePath): ?string
    {
        if (is_file($this->legacyFile($kind, $legacyPath)) === FALSE) {
            return null;
        }

        $targetDir = dirname($this->targetFile($kind, $filePath));

        if (is_dir($targetDir) === FALSE && $this->quietly(fn () => mkdir($targetDir, 0775, true)) === FALSE) {
            return 'mkdir failed';
        }

        $source = $this->pathGuard->resolve($this->legacyRoot . '/' . $kind, $legacyPath);
        $target = $this->pathGuard->resolve($this->storageRoot . '/' . $kind, $filePath);

        if ($source === null || $target === null) {
            return 'unsafe path';
        }

        if ($this->quietly(fn () => rename($source, $target)) === FALSE) {
            return 'rename failed';
        }

        return null;
    }

    /**
     * Runs a filesystem operation with its PHP warnings silenced; its
     * failure is reported through the returned boolean instead.
     *
     * @param callable $operation The operation to run.
     * @return boolean The operation's result.
     */
    private function quietly(callable $operation): bool
    {
        set_error_handler(static fn (): bool => true);

        try {
            return $operation();
        } finally {
            restore_error_handler();
        }
    }

    /**
     * Builds `<legacyRoot>/<kind>/<legacyPath>`.
     *
     * @param string $kind       The kind folder (photos or snaps).
     * @param string $legacyPath The legacy path, relative to the kind folder.
     * @return string
     */
    private function legacyFile(string $kind, string $legacyPath): string
    {
        return $this->legacyRoot . '/' . $kind . '/' . $legacyPath;
    }

    /**
     * Builds `<storageRoot>/<kind>/<filePath>`.
     *
     * @param string $kind     The kind folder (photos or snaps).
     * @param string $filePath The new path, relative to the kind folder.
     * @return string
     */
    private function targetFile(string $kind, string $filePath): string
    {
        return $this->storageRoot . '/' . $kind . '/' . $filePath;
    }
}

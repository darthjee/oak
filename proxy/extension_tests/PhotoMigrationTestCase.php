<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/ErrorLogCapture.php';
require_once __DIR__ . '/PhotoRequestHandlerTestCase.php';

/**
 * Shared fixture setup for the legacy photo migration tests: on top of the
 * temp `storageRoot`, creates a separate temp `legacyRoot`, silences
 * `error_log`, and seeds `photos/`/`snaps/` files under either root.
 */
abstract class PhotoMigrationTestCase extends PhotoRequestHandlerTestCase
{
    use ErrorLogCapture;

    protected const LEGACY_PATH = 'users/3/items/42/old photo é.jpg';

    protected const FILE_PATH = 'users/3/items/42/new-uuid.jpg';

    protected string $legacyRoot;

    /** @var array The value returned by captureErrorLog(). */
    private array $log;

    protected function setUp(): void
    {
        parent::setUp();

        $this->legacyRoot = $this->storageRoot . '_legacy';
        mkdir($this->legacyRoot, 0775, true);

        // Every missing/failed photo is logged; keep the test output clean.
        $this->log = $this->captureErrorLog();
    }

    protected function tearDown(): void
    {
        $this->restoreErrorLog($this->log);
        $this->removeDirRecursive($this->legacyRoot);

        parent::tearDown();
    }

    /**
     * Seeds `<root>/<kind>/<path>` for each kind, with `<kind>` as content.
     *
     * @param string   $root  The root to seed under.
     * @param string   $path  The path, relative to each kind folder.
     * @param string[] $kinds The kind folders to seed.
     * @return void
     */
    protected function seed(string $root, string $path, array $kinds = ['photos', 'snaps']): void
    {
        foreach ($kinds as $kind) {
            $destination = $root . '/' . $kind . '/' . $path;

            if (is_dir(dirname($destination)) === false) {
                mkdir(dirname($destination), 0775, true);
            }

            file_put_contents($destination, $kind);
        }
    }

    /**
     * The sorted, root-relative paths of the given kinds of `$path`.
     *
     * @param string   $path  The path, relative to each kind folder.
     * @param string[] $kinds The kind folders.
     * @return string[]
     */
    protected function kindPaths(string $path, array $kinds = ['photos', 'snaps']): array
    {
        return array_map(fn ($kind) => $kind . '/' . $path, $kinds);
    }
}

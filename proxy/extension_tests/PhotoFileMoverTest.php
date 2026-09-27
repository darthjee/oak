<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoMigrationTestCase.php';

use Oak\Proxy\PhotoFileMover;
use Oak\Proxy\PhotoPathGuard;

class PhotoFileMoverTest extends PhotoMigrationTestCase
{
    protected function tempDirPrefix(): string
    {
        return 'photo_file_mover_test_';
    }

    public function testMovesBothKindsCreatingTheTargetDirectories(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH);

        $result = $this->buildMover()->migrate(self::LEGACY_PATH, self::FILE_PATH);

        $this->assertSame(['status' => 'migrated', 'reason' => null], $result);
        $this->assertSame([], $this->filesUnder($this->legacyRoot));
        $this->assertSame($this->kindPaths(self::FILE_PATH), $this->filesUnder($this->storageRoot));
        $this->assertSame('snaps', file_get_contents($this->storageRoot . '/snaps/' . self::FILE_PATH));
    }

    public function testMovesWithinASingleRoot(): void
    {
        $this->seed($this->storageRoot, self::LEGACY_PATH);

        $mover = new PhotoFileMover($this->storageRoot, $this->storageRoot, new PhotoPathGuard());
        $result = $mover->migrate(self::LEGACY_PATH, self::FILE_PATH);

        $this->assertSame('migrated', $result['status']);
        $this->assertSame($this->kindPaths(self::FILE_PATH), $this->filesUnder($this->storageRoot));
    }

    public function testResumesWhenBothFilesWereAlreadyMoved(): void
    {
        $this->seed($this->storageRoot, self::FILE_PATH);

        $result = $this->buildMover()->migrate(self::LEGACY_PATH, self::FILE_PATH);

        $this->assertSame('migrated', $result['status']);
        $this->assertSame($this->kindPaths(self::FILE_PATH), $this->filesUnder($this->storageRoot));
    }

    public function testMovesTheKindStillAtItsLegacyPath(): void
    {
        $this->seed($this->storageRoot, self::FILE_PATH, ['photos']);
        $this->seed($this->legacyRoot, self::LEGACY_PATH, ['snaps']);

        $result = $this->buildMover()->migrate(self::LEGACY_PATH, self::FILE_PATH);

        $this->assertSame('migrated', $result['status']);
        $this->assertSame([], $this->filesUnder($this->legacyRoot));
        $this->assertSame($this->kindPaths(self::FILE_PATH), $this->filesUnder($this->storageRoot));
    }

    public function testIsMissingWithoutTouchingAnythingWhenAKindIsAbsentEverywhere(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH, ['photos']);

        $result = $this->buildMover()->migrate(self::LEGACY_PATH, self::FILE_PATH);

        $this->assertSame(['status' => 'missing', 'reason' => null], $result);
        $this->assertSame($this->kindPaths(self::LEGACY_PATH, ['photos']), $this->filesUnder($this->legacyRoot));
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testFailsWhenTheTargetDirectoryCannotBeCreated(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH);
        mkdir($this->storageRoot . '/photos', 0775, true);
        // A regular file where the `users` directory should be blocks mkdir.
        file_put_contents($this->storageRoot . '/photos/users', 'blocker');

        $result = $this->buildMover()->migrate(self::LEGACY_PATH, self::FILE_PATH);

        $this->assertSame(['status' => 'failed', 'reason' => 'mkdir failed'], $result);
        $this->assertSame($this->kindPaths(self::LEGACY_PATH), $this->filesUnder($this->legacyRoot));
    }

    public function testFailsWhenTheRenameFails(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH);
        // A non-empty directory at the target makes rename() fail.
        mkdir($this->storageRoot . '/photos/' . self::FILE_PATH, 0775, true);
        file_put_contents($this->storageRoot . '/photos/' . self::FILE_PATH . '/blocker', 'blocker');

        $result = $this->buildMover()->migrate(self::LEGACY_PATH, self::FILE_PATH);

        $this->assertSame(['status' => 'failed', 'reason' => 'rename failed'], $result);
        $this->assertFileExists($this->legacyRoot . '/photos/' . self::LEGACY_PATH);
    }

    public function testFailsWhenTheTargetEscapesItsRoot(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH);
        mkdir($this->storageRoot . '/photos/users/3', 0775, true);
        // A symlinked item folder pointing outside storageRoot/photos.
        symlink($this->legacyRoot, $this->storageRoot . '/photos/users/3/items');

        $result = $this->buildMover()->migrate(self::LEGACY_PATH, 'users/3/items/new-uuid.jpg');

        $this->assertSame(['status' => 'failed', 'reason' => 'unsafe path'], $result);
        $this->assertFileExists($this->legacyRoot . '/photos/' . self::LEGACY_PATH);
    }

    private function buildMover(): PhotoFileMover
    {
        return new PhotoFileMover($this->legacyRoot, $this->storageRoot, new PhotoPathGuard());
    }
}

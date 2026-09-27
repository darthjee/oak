<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoMigrationRequestHandlerTestCase.php';

/**
 * Batch classification of the photo migration handler: moved files, the
 * `PATCH` payload (or its absence) and the response shape.
 */
class PhotoMigrationRequestHandlerBatchTest extends PhotoMigrationRequestHandlerTestCase
{
    private const OTHER_LEGACY_PATH = 'users/3/items/43/other.jpg';

    private const OTHER_FILE_PATH = 'users/3/items/43/other-uuid.jpg';

    protected function tempDirPrefix(): string
    {
        return 'photo_migration_batch_test_';
    }

    public function testMovesFilesAcrossRootsAndReportsTheBatch(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH);
        $this->seed($this->legacyRoot, self::OTHER_LEGACY_PATH, ['photos']);
        $httpClient = new FakeHttpClient([
            $this->prepareResponse([
                $this->photo(17),
                $this->photo(18, self::OTHER_LEGACY_PATH, self::OTHER_FILE_PATH)
            ], 12),
            ['body' => '', 'httpCode' => 200, 'headers' => []]
        ]);

        $response = $this->handle($httpClient);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(
            ['migrated' => 1, 'missing' => [18], 'failed' => [], 'remaining' => 10],
            $this->json($response)
        );
        $this->assertSame($this->kindPaths(self::FILE_PATH), $this->filesUnder($this->storageRoot));
        $this->assertSame($this->kindPaths(self::OTHER_LEGACY_PATH, ['photos']), $this->filesUnder($this->legacyRoot));
    }

    public function testConfirmsTheMigratedAndMissingIds(): void
    {
        $this->seed($this->storageRoot, self::FILE_PATH);
        $httpClient = new FakeHttpClient([
            $this->prepareResponse([
                $this->photo(17),
                $this->photo(18, self::OTHER_LEGACY_PATH, self::OTHER_FILE_PATH)
            ], 2),
            ['body' => '', 'httpCode' => 200, 'headers' => []]
        ]);

        $this->handle($httpClient);

        $this->assertCount(2, $httpClient->calls);
        $this->assertSame('PATCH', $httpClient->calls[1]['method']);
        $this->assertSame(self::CONFIRM_URL, $httpClient->calls[1]['url']);
        $this->assertSame('{"migrated":[17],"missing":[18]}', $httpClient->calls[1]['body']);
    }

    public function testFailsInvalidPathsWithoutTouchingFilesOrPatching(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH);
        $httpClient = new FakeHttpClient([
            $this->prepareResponse([
                $this->photo(17, self::LEGACY_PATH, '../../escape.jpg'),
                $this->photo(18, null),
                $this->photo('19'),
                'not an entry'
            ], 4)
        ]);

        $response = $this->handle($httpClient);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame([
            'migrated' => 0,
            'missing' => [],
            'failed' => [['id' => 17, 'reason' => 'invalid path'], ['id' => 18, 'reason' => 'invalid path']],
            'remaining' => 4
        ], $this->json($response));
        $this->assertCount(1, $httpClient->calls);
        $this->assertSame($this->kindPaths(self::LEGACY_PATH), $this->filesUnder($this->legacyRoot));
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testSkipsThePatchForAnEmptyBatch(): void
    {
        $httpClient = new FakeHttpClient([$this->prepareResponse([], 0)]);

        $response = $this->handle($httpClient);

        $this->assertSame(200, $response->httpCode());
        $this->assertSame(['migrated' => 0, 'missing' => [], 'failed' => [], 'remaining' => 0], $this->json($response));
        $this->assertCount(1, $httpClient->calls);
    }

    public function testFloorsTheRemainingCountAtZero(): void
    {
        $this->seed($this->legacyRoot, self::LEGACY_PATH);
        $httpClient = new FakeHttpClient([
            $this->prepareResponse([
                $this->photo(17),
                $this->photo(18, self::OTHER_LEGACY_PATH, self::OTHER_FILE_PATH)
            ], 1),
            ['body' => '', 'httpCode' => 200, 'headers' => []]
        ]);

        $response = $this->handle($httpClient);

        $this->assertSame(0, $this->json($response)['remaining']);
    }
}

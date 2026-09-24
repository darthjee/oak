<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';
require_once __DIR__ . '/PhotoRequestHandlerTestCase.php';
require_once __DIR__ . '/PhotoVersionFixtures.php';

use Oak\Proxy\PhotoDeleteRequestHandler;
use Tent\Models\ProcessingRequest;

/**
 * Shared helpers for the photo Delete handler tests: silences `error_log`,
 * builds the handler, the Delete request and a backend client that accepts
 * both the deletable gate and the row-delete call.
 */
abstract class PhotoDeleteRequestHandlerTestCase extends PhotoRequestHandlerTestCase
{
    use PhotoVersionFixtures;

    protected const DELETE_PATH = '/uploads/categories/miniatures/items/42/photos/7';

    protected const DELETABLE_URL = 'http://backend:3000/categories/miniatures/items/42/photos/7/deletable.json';

    protected const DESTROY_URL = 'http://backend:3000/categories/miniatures/items/42/photos/7.json';

    /** @var string|false The error_log setting before the test silenced it. */
    private $previousErrorLog;

    protected function setUp(): void
    {
        parent::setUp();

        // The deleter logs every skipped version; keep the test output clean.
        $this->previousErrorLog = ini_set('error_log', '/dev/null');
    }

    protected function tearDown(): void
    {
        ini_set('error_log', $this->previousErrorLog === false ? '' : $this->previousErrorLog);

        parent::tearDown();
    }

    /**
     * Builds a backend client whose deletable gate returns `$filePath` and
     * whose row-delete call succeeds.
     *
     * @param string $filePath The backend-computed file path.
     * @return FakeHttpClient
     */
    protected function successfulClient(string $filePath): FakeHttpClient
    {
        return new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
            ['body' => '', 'httpCode' => 200, 'headers' => []]
        ]);
    }

    /**
     * Builds the handler under test, deleting under `storageRoot`.
     *
     * @param FakeHttpClient $httpClient Backend client.
     * @return PhotoDeleteRequestHandler
     */
    protected function buildHandler(FakeHttpClient $httpClient): PhotoDeleteRequestHandler
    {
        return new PhotoDeleteRequestHandler(
            'http://backend:3000',
            $this->storageRoot,
            $httpClient
        );
    }

    /**
     * Builds a Delete request.
     *
     * @param string|null $cookie The Cookie header, if any.
     * @return ProcessingRequest
     */
    protected function buildRequest(?string $cookie = null): ProcessingRequest
    {
        $headers = $cookie !== null ? ['Cookie' => $cookie] : [];

        return new ProcessingRequest([
            'requestMethod' => 'DELETE',
            'requestPath' => self::DELETE_PATH,
            'headers' => $headers,
            'uploadedFiles' => [],
            'postFields' => []
        ]);
    }
}

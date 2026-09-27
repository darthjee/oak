<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';
require_once __DIR__ . '/PhotoMigrationTestCase.php';

use Oak\Proxy\PhotoMigrationRequestHandler;
use Tent\Models\ProcessingRequest;

/**
 * Shared helpers for the photo migration handler tests: builds the handler
 * (with distinct `legacyRoot`/`storageRoot`), the request and the backend
 * `prepare`/`PATCH` responses.
 */
abstract class PhotoMigrationRequestHandlerTestCase extends PhotoMigrationTestCase
{
    protected const PREPARE_URL = 'http://backend:3000/user/photos/migration/prepare';

    protected const CONFIRM_URL = 'http://backend:3000/user/photos/migration';

    /**
     * Builds a successful `prepare` response.
     *
     * @param array   $photos    The `photos` entries.
     * @param integer $remaining The `remaining` count.
     * @return array
     */
    protected function prepareResponse(array $photos, int $remaining): array
    {
        return [
            'body' => json_encode(['photos' => $photos, 'remaining' => $remaining]),
            'httpCode' => 200,
            'headers' => []
        ];
    }

    /**
     * Builds one `photos` entry of a `prepare` response.
     *
     * @param mixed $photoId    The photo id.
     * @param mixed $legacyPath The legacy path.
     * @param mixed $filePath   The new path.
     * @return array
     */
    protected function photo(
        mixed $photoId,
        mixed $legacyPath = self::LEGACY_PATH,
        mixed $filePath = self::FILE_PATH
    ): array {
        return ['id' => $photoId, 'legacy_path' => $legacyPath, 'file_path' => $filePath];
    }

    /**
     * Runs a `POST /migrations/photos` request through the handler.
     *
     * @param FakeHttpClient $httpClient Backend client.
     * @param string         $query      The incoming query string.
     * @param string|null    $cookie     The Cookie header, if any.
     * @return \Tent\Models\Response
     */
    protected function handle(FakeHttpClient $httpClient, string $query = 'limit=5', ?string $cookie = null)
    {
        $handler = new PhotoMigrationRequestHandler(
            'http://backend:3000',
            $this->storageRoot,
            $this->legacyRoot,
            $httpClient
        );

        return $handler->handleRequest(new ProcessingRequest([
            'requestMethod' => 'POST',
            'requestPath' => '/migrations/photos',
            'query' => $query,
            'headers' => $cookie !== null ? ['Cookie' => $cookie] : [],
            'uploadedFiles' => [],
            'postFields' => []
        ]));
    }

    /**
     * Decodes a JSON response body.
     *
     * @param \Tent\Models\Response $response The handler's response.
     * @return array
     */
    protected function json($response): array
    {
        return json_decode($response->body(), true);
    }
}

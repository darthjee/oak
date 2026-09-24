<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/ErrorLogCapture.php';
require_once __DIR__ . '/FakeHttpClient.php';
require_once __DIR__ . '/PhotoRequestHandlerTestCase.php';

use Oak\Proxy\PhotoSubmitRequestHandler;
use Tent\Models\ProcessingRequest;

/**
 * Shared helpers for the photo Submit handler tests: builds the handler,
 * the Submit request and its uploaded file, and a backend client that
 * accepts both status-gate calls.
 */
abstract class PhotoSubmitRequestHandlerTestCase extends PhotoRequestHandlerTestCase
{
    use ErrorLogCapture;

    protected const SUBMIT_PATH = '/uploads/categories/miniatures/items/42/photos/7/submit';

    /**
     * Builds a backend client whose status gate returns `$filePath` and
     * whose Finalize call succeeds.
     *
     * @param string $filePath The backend-computed file path.
     * @return FakeHttpClient
     */
    protected function successfulClient(string $filePath): FakeHttpClient
    {
        return new FakeHttpClient([
            ['body' => json_encode(['file_path' => $filePath]), 'httpCode' => 200, 'headers' => []],
            ['body' => '{}', 'httpCode' => 200, 'headers' => []]
        ]);
    }

    /**
     * Builds the handler under test, writing under `storageRoot`.
     *
     * @param FakeHttpClient $httpClient         Backend client.
     * @param integer        $maxUploadSizeBytes Upload size limit.
     * @return PhotoSubmitRequestHandler
     */
    protected function buildHandler(
        FakeHttpClient $httpClient,
        int $maxUploadSizeBytes = 1_048_576
    ): PhotoSubmitRequestHandler {
        return new PhotoSubmitRequestHandler(
            'http://backend:3000',
            $this->storageRoot,
            $maxUploadSizeBytes,
            ['jpg', 'jpeg', 'png'],
            $httpClient
        );
    }

    /**
     * Builds an uploaded-file entry whose temp file holds `$contents`.
     *
     * @param string $name     The uploaded file's original name.
     * @param string $contents The uploaded bytes.
     * @return array
     */
    protected function buildUploadedFile(string $name, string $contents): array
    {
        $tmpName = tempnam(sys_get_temp_dir(), 'photo_submit_upload_');
        file_put_contents($tmpName, $contents);

        return [
            'name' => $name,
            'type' => 'application/octet-stream',
            'tmp_name' => $tmpName,
            'error' => UPLOAD_ERR_OK,
            'size' => strlen($contents)
        ];
    }

    /**
     * Builds a Submit request carrying `$uploadedFile`.
     *
     * @param array       $uploadedFile The uploaded-file entry.
     * @param string|null $cookie       The Cookie header, if any.
     * @return ProcessingRequest
     */
    protected function buildRequest(array $uploadedFile, ?string $cookie = null): ProcessingRequest
    {
        $headers = $cookie !== null ? ['Cookie' => $cookie] : [];

        return new ProcessingRequest([
            'requestMethod' => 'POST',
            'requestPath' => self::SUBMIT_PATH,
            'headers' => $headers,
            'uploadedFiles' => ['file' => $uploadedFile],
            'postFields' => []
        ]);
    }
}

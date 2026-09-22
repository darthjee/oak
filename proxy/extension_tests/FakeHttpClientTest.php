<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/FakeHttpClient.php';

use PHPUnit\Framework\TestCase;

class FakeHttpClientTest extends TestCase
{
    public function testRequestRecordsUploadedFilesAndPostFields(): void
    {
        $httpClient = new FakeHttpClient();
        $uploadedFiles = ['file' => ['name' => 'photo.jpg', 'tmp_name' => '/tmp/photo.jpg']];
        $postFields = ['status' => 'ready'];

        $httpClient->request('POST', 'http://backend:3000/photos', [], null, $uploadedFiles, $postFields);

        $this->assertCount(1, $httpClient->calls);
        $this->assertSame($uploadedFiles, $httpClient->calls[0]['uploadedFiles']);
        $this->assertSame($postFields, $httpClient->calls[0]['postFields']);
    }

    public function testRequestRecordsDefaultEmptyUploadedFilesAndPostFields(): void
    {
        $httpClient = new FakeHttpClient();

        $httpClient->request('PATCH', 'http://backend:3000/photos/7.json', [], '{"status":"ready"}');

        $this->assertCount(1, $httpClient->calls);
        $this->assertSame([], $httpClient->calls[0]['uploadedFiles']);
        $this->assertSame([], $httpClient->calls[0]['postFields']);
    }
}

<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoSubmitRequestHandlerTestCase.php';

class PhotoSubmitRequestHandlerValidationTest extends PhotoSubmitRequestHandlerTestCase
{
    protected function tempDirPrefix(): string
    {
        return 'photo_submit_validation_test_';
    }

    public function testRejectsDisallowedExtensionWithoutCallingBackendOrWriting(): void
    {
        $httpClient = new FakeHttpClient();
        $handler = $this->buildHandler($httpClient);
        $uploadedFile = $this->buildUploadedFile('photo.txt', 'not a photo');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile));

        $this->assertSame(415, $response->httpCode());
        $this->assertSame([], $httpClient->calls);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testRejectsOversizedUploadWithoutCallingBackendOrWriting(): void
    {
        $httpClient = new FakeHttpClient();
        $handler = $this->buildHandler($httpClient, 4);
        $uploadedFile = $this->buildUploadedFile('photo.jpg', 'way too large for the limit');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile));

        $this->assertSame(413, $response->httpCode());
        $this->assertSame([], $httpClient->calls);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }

    public function testStopsBeforeWritingWhenTheUploadingGateIsRejected(): void
    {
        $httpClient = new FakeHttpClient([
            ['body' => '{"error":"forbidden"}', 'httpCode' => 403, 'headers' => []]
        ]);
        $handler = $this->buildHandler($httpClient);
        $uploadedFile = $this->buildUploadedFile('photo.jpg', 'bytes');

        $response = $handler->handleRequest($this->buildRequest($uploadedFile));

        $this->assertSame(403, $response->httpCode());
        $this->assertSame('{"error":"forbidden"}', $response->body());
        $this->assertCount(1, $httpClient->calls);
        $this->assertSame([], $this->filesUnder($this->storageRoot));
    }
}

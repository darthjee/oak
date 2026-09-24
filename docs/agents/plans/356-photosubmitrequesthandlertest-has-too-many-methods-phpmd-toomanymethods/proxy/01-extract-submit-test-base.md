# Extract the shared submit test base class
Create `abstract class PhotoSubmitRequestHandlerTestCase extends PhotoRequestHandlerTestCase` (namespace `Oak\Proxy\Tests`). Move these out of `PhotoSubmitRequestHandlerTest`, as `protected`:

- the `SUBMIT_PATH` constant;
- `buildHandler(FakeHttpClient $httpClient, int $maxUploadSizeBytes = 1_048_576): PhotoSubmitRequestHandler`;
- `buildRequest(array $uploadedFile, ?string $cookie = null): ProcessingRequest`;
- `buildUploadedFile(string $name, string $contents): array`;
- `successfulClient(string $filePath): FakeHttpClient`;
- `captureErrorLog(): array` / `restoreErrorLog(array $log): string`. Put these two in a trait (e.g. `ErrorLogCapture` in `ErrorLogCapture.php`) and use it from the base class, so step 03 can reuse them without inheriting the handler helpers.

The base class `require_once`s `FakeHttpClient.php`, `PhotoRequestHandlerTestCase.php` and the trait file, and keeps `tempDirPrefix()` abstract (inherited). Add a short class docblock like the one on `PhotoRequestHandlerTestCase`.

## Files to Change
- `proxy/extension_tests/PhotoSubmitRequestHandlerTestCase.php` — new abstract base class holding the shared submit helpers.
- `proxy/extension_tests/ErrorLogCapture.php` — new trait with `captureErrorLog` / `restoreErrorLog`.

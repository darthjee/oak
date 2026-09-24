# Extract shared delete-test fixtures
Move the fixture logic out of `PhotoDeleteRequestHandlerTest` so both the handler test and the new `PhotoFileDeleterTest` can reuse it.

- Create a trait `PhotoVersionFixtures` holding `PREFIXES`-based helpers `writeVersions(string $filePath, array $prefixes = [...])` and `versionPaths(string $filePath): array`, operating on `$this->storageRoot` (traits can't declare constants on older PHP — keep the default prefixes as a literal or a private static/method, whichever the project's PHP version supports cleanly).
- Create abstract `PhotoDeleteRequestHandlerTestCase extends PhotoRequestHandlerTestCase`, using `PhotoVersionFixtures`, holding:
  - constants `DELETE_PATH`, `DELETABLE_URL`, `DESTROY_URL` (protected);
  - the `setUp`/`tearDown` that point `error_log` at `/dev/null` and restore it (or reuse `ErrorLogCapture`);
  - `buildHandler(FakeHttpClient $httpClient): PhotoDeleteRequestHandler`;
  - `buildRequest(?string $cookie = null): ProcessingRequest`;
  - optionally `successfulClient(string $filePath): FakeHttpClient` returning the gate-200 (`{"file_path": ...}`) + delete-200 client used by several tests.
- Add docblocks matching `PhotoSubmitRequestHandlerTestCase`'s style.

## Files to Change
- `proxy/extension_tests/PhotoVersionFixtures.php` — new trait with `writeVersions` / `versionPaths`.
- `proxy/extension_tests/PhotoDeleteRequestHandlerTestCase.php` — new abstract base with delete-handler constants, error_log silencing and builders.

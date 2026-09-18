# Add PHPUnit coverage

Add `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php`, following
`PhotoSubmitRequestHandlerTest.php`'s conventions (temp `photosPath` in
`setUp()`/`tearDown()`, a fake `HttpClientInterface` that records calls and
replays queued responses, `ProcessingRequest`-built requests).

`PhotoSubmitRequestHandlerTest.php` currently declares its `FakeHttpClient`
double inline in the same file. Since the delete handler's tests need the
same double, extract it into its own file (e.g.
`proxy/extension_tests/FakeHttpClient.php`, same `Oak\Proxy\Tests`
namespace) and update `PhotoSubmitRequestHandlerTest.php` to drop its
inline copy — avoids duplicating the double across two test files.

Cases to cover for `PhotoDeleteRequestHandlerTest`:

- **Happy path**: `deletable.json` returns `200 { file_path }`, the file
  exists on disk and gets deleted, then the backend `DELETE` call is made
  (assert call order: `deletable` POST before `DELETE`), handler responds
  `200`.
- **Already-missing file**: `deletable.json` returns a valid `file_path`
  but no file exists at that path — handler still calls backend `DELETE`
  and responds `200` (no-op delete, not an error).
- **Non-2xx from `deletable.json`** (e.g. `422` not-ready, `403` not-owner):
  response and body are relayed as-is, no `DELETE` call is made, and
  nothing is deleted from disk.
- **Non-2xx from the backend `DELETE` call**: relayed as-is (the file was
  already unlinked at this point per the decided ordering — assert the
  file is gone even though the overall response is an error).
- **Cookie forwarding**: assert the `Cookie` header is present on both the
  `deletable.json` POST and the `DELETE` call.

Also add regression coverage to `PhotoSubmitRequestHandlerTest.php` (or a
new small test file) for the `PhotoPathGuard` retrofit from step 01 — at
minimum, a case asserting the happy path (valid backend-computed
`file_path`) still writes successfully through the guard, to catch a
regression where the guard incorrectly rejects a legitimate path.

## Files to Change

- `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php` (new) — cases
  above.
- `proxy/extension_tests/FakeHttpClient.php` (new) — extracted shared
  test double.
- `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php` — drop the
  inline `FakeHttpClient` in favor of the extracted one; add a guard
  regression case.

Run `docker compose run --rm extension_tests` locally to confirm.

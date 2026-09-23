# Submit writes origin, photo and snap
Change `PhotoSubmitRequestHandler` so one upload produces all three files under a `storageRoot` option.

- Replace the `photosPath` constructor argument and `build()` key with `storageRoot` (default `/tmp/photos`). Keep the argument order otherwise; the optional `$httpClient` stays last. Add an optional `PhotoImageResizer` (defaults to a new one) only if tests need to inject a failing resizer; otherwise a failure can be forced with an unreadable/invalid image.
- Flow after the `uploading` gate returns `file_path`:
  1. Move the upload to `<storageRoot>/origin/<file_path>` (the existing `writeFile` logic, with `<storageRoot>/origin` as the guard root).
  2. Resize the origin into `<storageRoot>/photos/<file_path>` (800x1064).
  3. Resize the origin into `<storageRoot>/snaps/<file_path>` (215x215).
  4. Call finalize (`ready`) only when all three succeeded.
- For each prefix, `mkdir -p` the parent dir, then resolve the destination with `PhotoPathGuard::resolve("<storageRoot>/<prefix>", $filePath)`. Create the prefix root itself if missing, so `realpath` works. A null from the guard is a failure.
- On any failure: unlink every file already written for this upload (origin included), `error_log` the photo id and `file_path` and which step failed, don't finalize, and return `502` with a clear message (e.g. `Failed to store uploaded file` / `Failed to resize uploaded file`).
- Update the class docblock (steps 3–4) to describe the three writes and the rollback.

Specs in `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php` (and `PhotoRequestHandlerTestCase.php`):
- Rename the fixture's `photosPath` to `storageRoot`; update the existing assertions to `origin/`.
- Happy path with a GD-made large jpeg: origin, photos and snaps exist with the expected maximum sizes; finalize called after the writes.
- Same for png.
- A resize failure (e.g. a `.jpg` upload whose bytes aren't an image) → 502, no files in any prefix, no finalize call (check the FakeHttpClient's recorded requests).
- A `file_path` with `..` is rejected (no file written outside any prefix, no finalize).

## Files to Change
- `proxy/extension/PhotoSubmitRequestHandler.php` — `storageRoot`, three writes, rollback, logging.
- `proxy/extension_tests/PhotoRequestHandlerTestCase.php` — fixture renamed to `storageRoot`; helper to make a GD image upload.
- `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php` — updated and new specs.

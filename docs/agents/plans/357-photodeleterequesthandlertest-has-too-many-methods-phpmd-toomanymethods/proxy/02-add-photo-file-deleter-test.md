# Add PhotoFileDeleterTest
Unit-test `PhotoFileDeleter` directly, taking over the file-level cases currently tested through the handler.

`PhotoFileDeleterTest extends PhotoRequestHandlerTestCase`, `use PhotoVersionFixtures` (and silence/capture `error_log`, e.g. via `ErrorLogCapture` or a setUp/tearDown pair), builds `new PhotoFileDeleter($this->storageRoot, new PhotoPathGuard())`. Tests:
- deletes all three versions (`origin`, `photos`, `snaps`) → `filesUnder(storageRoot) === []`;
- only some versions present (e.g. only `origin`) → deletes those, no error;
- already-missing file → no-op, no error, no directories created;
- a `file_path` escaping the prefix folders (`../escape.jpg`, with `escape.jpg` seeded at the storage root plus the three normal versions) → nothing outside the prefix folders is deleted (`escape.jpg` still exists; 4 files remain).

Keep the class at or below 10 methods.

## Files to Change
- `proxy/extension_tests/PhotoFileDeleterTest.php` — new test class.

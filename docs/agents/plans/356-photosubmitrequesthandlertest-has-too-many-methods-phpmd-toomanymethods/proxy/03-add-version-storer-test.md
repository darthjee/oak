# Add PhotoVersionStorerTest
Unit-test `PhotoVersionStorer::store()` directly. Extend `PhotoRequestHandlerTestCase` (for the temp `storageRoot`, `buildImageUpload`, `filesUnder`, `imageInfo`) and use the `ErrorLogCapture` trait. Build the storer with a real `PhotoPathGuard` and `PhotoImageResizer`: `new PhotoVersionStorer($this->storageRoot, new PhotoPathGuard(), new PhotoImageResizer())`. Use a `tempnam` file (or `buildImageUpload`'s `tmp_name`) as `tmpName`; `moveUpload` falls back to `rename` for it.

Cases, at 10 or fewer methods including `tempDirPrefix` and any small builder:
- success: returns `null`; `origin/<file_path>` holds the original bytes; `photos/` and `snaps/` exist with the expected sizes (e.g. 2000x1500 JPEG gives 800x600 and 215x161);
- nested `file_path` (`users/1/items/42/photos/nested/deep/photo.jpg`): returns `null` and writes all three prefixes;
- path escaping (`../escape.jpg`): returns `'Failed to store uploaded file'`, and nothing is written under `storageRoot`;
- non-image source: returns `'Failed to resize uploaded file'`, every written file (origin included) is removed, and the log mentions the photo id and `file_path`.

## Files to Change
- `proxy/extension_tests/PhotoVersionStorerTest.php` — new unit test for `PhotoVersionStorer`.

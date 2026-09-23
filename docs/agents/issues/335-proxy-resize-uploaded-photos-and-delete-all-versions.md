# Issue: Proxy: resize uploaded photos and delete all versions

## Description
Make the proxy create resized versions of each uploaded photo: an 800px "photo" and a 215px "snap", matching what `prod_public_files/convert.sh` does by hand today (ImageMagick `-resize 800x1064>` and `215x215>`). Delete must remove all three files. Parent: #328. Guide: `docs/agents/specs/photo/resizing.md`.

Depends on #333 (`origin/` layout, done) and #334 (Tent 1.0.0 with GD, done).

## Problem
The backend runs on Render and can't see the Dreamhost disk, so it can't make the resized versions. Today the proxy writes only the original, under `<storageRoot>/origin/`, and `photos/` and `snaps/` must be made by running `convert.sh` by hand and rsyncing the results. Delete removes only the original, leaving old resized files behind.

## Expected Behavior
- On submit, the proxy writes `origin/<file_path>`, `photos/<file_path>` (fit within 800x1064) and `snaps/<file_path>` (fit within 215x215) under `storageRoot`.
- 800x1064 and 215x215 are maximum boxes, fixed as constants in the handler. Resizing keeps the aspect ratio and scales down until both sides fit, so an 800x2128 original becomes a 400x1064 photo (not 800x2128) and a 108x215 snap. It only shrinks: an image that already fits is copied as is.
- EXIF orientation is honored: a jpeg with a rotation flag (from a phone camera, for example) is rotated upright, using `exif_read_data`, before resizing, so `photos/` and `snaps/` show it the right way up.
- The output format matches the input (jpg/jpeg to jpeg at quality ~85, png to png with transparency kept).
- Finalize (`PATCH ... { status: "ready" }`) is called only after all three files are on disk.
- If any write or resize fails, all files already written for this upload are removed (including the original), finalize is not called, an error is returned, and the failure is logged with the photo id and `file_path`.
- On delete, the origin, photo and snap files are removed. A missing file is not an error. The order stays the same: backend delete first, then files.

## Solution
- `PhotoSubmitRequestHandler` (`proxy/extension/`): after writing the original to `origin/`, use GD to write `photos/` and `snaps/`. Create directories as needed. Run every write through `PhotoPathGuard` with the prefix folder as the root, so a bad `file_path` can't leave it.
- `PhotoDeleteRequestHandler` / `PhotoFileDeleter`: remove the file under each of `origin/`, `photos/` and `snaps/`, each through `PhotoPathGuard`.
- Handler options: replace the `photosPath` option (now set to `<storageRoot>/origin`) with a `storageRoot` option in both prod (`proxy/prod_configuration/rules/uploads.php`, `deletes.php`) and dev (`docker_volumes/proxy_configuration/rules/uploads.php`, `deletes.php`) rules. The handlers add the `origin/`, `photos/` and `snaps/` prefixes.
- Use GD (plus `exif` for orientation) only, not `imagick` (the Tent images don't ship it). GD and exif were confirmed on the Dreamhost host `oak` for PHP 8.2, 8.3 and 8.4, so no `phpinfo()` check is needed.
- PHPUnit specs (tent-test) in `proxy/extension_tests/`, with test images made by GD inside the spec instead of committed binaries:
  - a large jpeg and png give `photos/` within 800x1064 and `snaps/` within 215x215, with the aspect ratio kept;
  - a tall image (e.g. 800x2128) gives a 400x1064 photo;
  - a small image is not upscaled;
  - a jpeg with an EXIF rotation flag comes out upright (skip this spec if GD in tent-test can't write EXIF test data; say so in the spec);
  - the output format matches the input;
  - finalize runs only after all three files exist; a resize failure leaves no partial files and no finalize call;
  - a `file_path` with `..` is rejected for every prefix;
  - delete removes all three files, and succeeds when some are missing.

### Acceptance criteria
- [ ] After a submit, the origin, photo and snap files exist with the expected maximum dimensions.
- [ ] Images keep their aspect ratio (800x2128 gives 400x1064), and smaller images are not upscaled.
- [ ] JPEGs with an EXIF rotation flag come out upright.
- [ ] The output format matches the input.
- [ ] A failed resize leaves no partial files and does not finalize.
- [ ] Delete removes all three files.
- [ ] PHPUnit specs (tent-test) cover resize, aspect ratio, no-upscale, EXIF orientation, format, failure cleanup, path guard and delete.

## Benefits
- No more running `convert.sh` and rsync by hand after each upload.
- New photos show up with their resized versions right away.
- Deleting a photo leaves no files behind on the Dreamhost disk.

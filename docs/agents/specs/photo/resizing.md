# Resizing and Delete

Target proxy behaviour for making the `photos/` and `snaps/` versions on
upload and removing all three files on delete (#335). This is a proposal,
not the current state.

## Why in the proxy

The backend runs on Render and has no access to the Dreamhost disk. Today
the resized versions come from `prod_public_files/convert.sh` (ImageMagick
`-resize 800x1064>` and `215x215>`), run by hand. The proxy already writes
the original, so it also makes the resized versions.

## Library

- PHP GD. The Tent images get GD in `darthjee/tent:1.0.0` and
  `darthjee/tent-test:1.0.0` (darthjee/tent#287), adopted in #334.
- Dreamhost PHP has `gd` and `imagick`. Check that `gd` is loaded under
  fcgid with a `phpinfo()` page before #335 ships, then delete that page.
- Don't depend on `imagick`: the Tent images don't ship it.

## Submit sequence

Current handler (`PhotoSubmitRequestHandler`): validate, status-gate, write
`<photosPath>/<file_path>`, finalize. Target:

1. Validate the multipart request (extension, size), as today.
2. Status-gate with the backend (`uploading`), as today, to get
   `file_path`.
3. Write `origin/<file_path>` under `storageRoot`, through `PhotoPathGuard`.
4. Write `photos/<file_path>`: fit within 800x1064.
5. Write `snaps/<file_path>`: fit within 215x215.
6. Finalize (`uploaded`) only once all three files exist.

Every write goes through `PhotoPathGuard::resolve(storageRoot, "<prefix>/<file_path>")`
(or with the prefix folder as the root), so a bad `file_path` can't escape
the prefix folder. Create parent directories as the handler does today.

### Resize rules

- **Fit, shrink only.** Keep the aspect ratio. Scale down so both sides fit
  in the box. Never upscale: if the original already fits, copy it as is.
  This matches ImageMagick's `>` flag used by `convert.sh`.
- **Keep the format.** jpg/jpeg in, jpeg out; png in, png out. Keep png
  transparency (`imagealphablending(false)`, `imagesavealpha(true)`).
- **EXIF orientation** (note): phone jpegs may carry a rotation flag. GD
  ignores it. Handling it (`exif_read_data` + rotate) is optional for #335;
  if skipped, note it as a known gap.
- Use a quality around 85 for jpeg.

### Failure handling

- If any write or resize fails, remove the files already written for this
  upload, don't finalize, and return an error. The photo stays `uploading`
  and follows the abandoned-upload handling in
  [Edge Cases](../../photo_upload/edge-cases-and-coexistence.md).
- Log the failure with the photo id and `file_path`.

## Delete

- `PhotoDeleteRequestHandler` / `PhotoFileDeleter` remove
  `origin/<file_path>`, `photos/<file_path>` and `snaps/<file_path>`, each
  through `PhotoPathGuard`.
- A missing file is not an error (the delete may be retried, or an older
  photo may lack a version).
- Keep the current order: backend delete first, then files, as in
  [Contracts](../../photo_upload/contracts.md).

## Tests (tent-test PHPUnit)

Specs live in `proxy/extension_tests/` and run on `darthjee/tent-test:1.0.0`:

- A large jpeg and png produce `photos/` within 800x1064 and `snaps/` within
  215x215, with the aspect ratio kept.
- A small image (smaller than both boxes) is not upscaled.
- The output format matches the input.
- Finalize is called only after all three files exist; a resize failure
  leaves no partial files and no finalize call.
- A `file_path` with `..` is rejected for every prefix.
- Delete removes all three files, and succeeds when some are missing.

Generate test images in the spec with GD, instead of committing binaries.

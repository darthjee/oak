# Photo Upload: Resizing & Storage

What the Tent proxy does with a photo file on Submit and on delete. The
backend runs on Render and can't see the Dreamhost disk, so all photo file
I/O and resizing happen in the proxy (`proxy/extension/`).

For where the files live in production and how they are served, see
[Photo Storage & Serving](../architecture/photo-storage.md).

## Paths

The backend `file_path` is `users/<uid>/items/<id>/<file>`. The handlers
take one `storageRoot` option and add the prefixes themselves:

| File | Path under `storageRoot` | Size |
| --- | --- | --- |
| Original upload | `origin/<file_path>` | unchanged |
| Photo | `photos/<file_path>` | fit within 800x1064, shrink only |
| Snap | `snaps/<file_path>` | fit within 215x215, shrink only |

Every path goes through `PhotoPathGuard`, so a bad `file_path` (e.g. one
with `..`) can't escape its prefix folder. Parent directories are created
as needed.

## Submit sequence

`PhotoSubmitRequestHandler` keeps validation and error responses, and
delegates the rest:

1. Validate the multipart request (extension, size).
2. Status-gate with the backend (`uploading`) to get `file_path`
   (`PhotoSubmitBackendGateway`).
3. Write `origin/`, `photos/` and `snaps/` (`PhotoVersionStorer`, which uses
   `PhotoImageResizer` for the two resized versions).
4. Finalize (`PATCH ... { status: "ready" }`) only once all three files
   exist (`PhotoSubmitBackendGateway`).

See [Contracts](contracts.md) for the request and response shapes.

## Resize rules

- **Library:** PHP GD. The `darthjee/tent:1.0.0` and `darthjee/tent-test:1.0.0`
  images ship GD, and the Dreamhost PHP has `gd` and `exif`. Don't depend
  on `imagick`: the Tent images don't ship it.
- **Fit, shrink only.** Keep the aspect ratio and scale down so both sides
  fit in the box. Never upscale: an original that already fits is copied
  as is (ImageMagick's `>` flag behaviour). A 800x2128 image gives a
  400x1064 photo.
- **Keep the format.** jpg/jpeg in, jpeg out (quality 85); png in, png out,
  with transparency kept.
- **EXIF orientation.** GD ignores the rotation flag phone jpegs carry, so
  the resizer reads it with `exif_read_data` and rotates the image upright
  before resizing.

## Failure handling

If any write or resize fails, the files already written for this upload
are removed, Finalize is not called, and the handler returns an error,
logging the photo id and `file_path`. The photo stays `uploading` and
follows the abandoned-upload handling in
[Edge Cases & Coexistence](edge-cases-and-coexistence.md).

## Delete

After the backend delete (see [Contracts](contracts.md)),
`PhotoDeleteRequestHandler` / `PhotoFileDeleter` remove
`origin/<file_path>`, `photos/<file_path>` and `snaps/<file_path>`, each
through `PhotoPathGuard`. A missing file is not an error: the delete may be
retried, or an older photo may lack a version.

## Tests

PHPUnit specs in `proxy/extension_tests/` run on `darthjee/tent-test:1.0.0`
(`docker compose run --rm extension_tests`). They cover:

- output sizes and kept aspect ratio for large jpeg and png images;
- no upscaling of small images;
- EXIF rotation and output format;
- Finalize only after all three files exist, and no partial files and no
  Finalize on a resize failure;
- `..` rejection for every prefix;
- delete of all three files, including when some are missing.

Test images are generated in the specs with GD; no binaries are committed.

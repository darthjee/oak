# Add the resizing and storage page

Create `docs/agents/photo_upload/resizing-and-storage.md`, describing what the
proxy does with the file on submit and delete, as it works today (present
tense, no issue-by-issue history). Source: `docs/agents/specs/photo/resizing.md`
and the path table in `docs/agents/specs/photo/index.md`, checked against
`proxy/extension/`.

Content:

- **Why in the proxy:** the backend runs on Render and can't see the
  Dreamhost disk, so all photo file I/O and resizing happen in Tent.
- **Paths:** the backend `file_path` is `users/<uid>/items/<id>/<file>`; the
  handlers take one `storageRoot` option and write `origin/<file_path>`
  (unchanged), `photos/<file_path>` (fit within 800x1064) and
  `snaps/<file_path>` (fit within 215x215). Every path goes through
  `PhotoPathGuard`.
- **Submit sequence and classes:** validate → status gate (`uploading`) via
  `PhotoSubmitBackendGateway` → `PhotoVersionStorer` writes the three files
  (`PhotoImageResizer` does the resizing) → Finalize (`ready`) only after all
  three exist.
- **Resize rules:** PHP GD (Tent 1.0.0 images; Dreamhost PHP has `gd` and
  `exif`; do not rely on `imagick`); fit, shrink only, never upscale; keep
  the format and png transparency; rotate by EXIF orientation first; jpeg
  quality around 85.
- **Failure handling:** remove files already written, don't finalize, return
  an error and log photo id and `file_path`; the photo stays `uploading`
  (link to [Edge Cases](edge-cases-and-coexistence.md)).
- **Delete:** `PhotoDeleteRequestHandler` / `PhotoFileDeleter` remove all three
  files after the backend delete; a missing file is not an error.
- **Tests:** what `proxy/extension_tests/` covers (sizes, aspect ratio, no
  upscale, EXIF, format, finalize ordering, rollback, `..` rejection, delete
  with missing files); test images generated with GD, no committed binaries.
- **Production checks:** the prod checklist from
  `docs/agents/specs/photo/rollout.md` ("Prod checklist"), written as a
  reusable post-deploy smoke check: upload returns 200 and is ready, three
  files exist under `$REMOTE_HOME/photos`, `/photos` and `/snaps` return 200
  with `Cache-Control: max-age=604800`, a missing photo is 404 not 302,
  photos survive another tagged deploy, delete removes all three files,
  `locals.php` survives the deploy.

Then link the page from `docs/agents/photo_upload/index.md` (the bullet list
of detail pages), and mention in that page's intro that production serving
and deploy are in [Infrastructure](../architecture/infrastructure.md).

## Files to Change

- `docs/agents/photo_upload/resizing-and-storage.md` — new page.
- `docs/agents/photo_upload/index.md` — link the new page and the
  infrastructure page.

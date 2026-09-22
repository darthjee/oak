# Resizing and delete

Create `docs/agents/specs/photo/resizing.md`, the target proxy behaviour for #335:

- Why in the proxy: the backend is on Render and has no access to the disk.
- Library: PHP GD, from `darthjee/tent:1.0.0` / `tent-test:1.0.0` (darthjee/tent#287). Dreamhost PHP has GD too; recommend checking `phpinfo()` through fcgid.
- Submit sequence: validate, then status-gate (`uploading`), then write `origin/<file_path>` through `PhotoPathGuard`, then write the `photos/` (fit 800x1064) and `snaps/` (fit 215x215) versions (shrink only, keep format: jpg/jpeg/png, EXIF orientation as a note), then finalize (`uploaded`) only once all three files exist. On failure, clean up partial files.
- Delete: `PhotoDeleteRequestHandler` / `PhotoFileDeleter` remove all three files, through the path guard.
- The test expectations for tent-test PHPUnit specs (dimensions, no upscaling, path guard, delete).

## Files to Change
- `docs/agents/specs/photo/resizing.md`: new.

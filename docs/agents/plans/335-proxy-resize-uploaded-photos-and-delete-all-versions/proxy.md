# Proxy Plan: Proxy: resize uploaded photos and delete all versions

Main plan: [plan.md](plan.md)

## Overview
Add a GD-based resizer to the Tent extension. Make `PhotoSubmitRequestHandler` write `origin/`, `photos/` and `snaps/` under a new `storageRoot` option, rolling back on failure. Make `PhotoDeleteRequestHandler` / `PhotoFileDeleter` remove all three. Switch the dev and prod rules to `storageRoot`.

## Context
- The backend runs on Render and can't reach the Dreamhost disk, so the proxy must make the resized files. Today `prod_public_files/convert.sh` does it by hand with ImageMagick `-resize 800x1064>` / `215x215>`.
- Guide: `docs/agents/specs/photo/resizing.md`.
- `darthjee/tent:1.0.0` and `darthjee/tent-test:1.0.0` ship `gd` and `exif` (checked: `php -m` in tent-test lists both). Dreamhost (`ssh oak`) has `gd` and `exif` in PHP 8.2, 8.3 and 8.4. Don't use `imagick`.
- The finalize call is `PATCH ... { status: "ready" }` (not `uploaded`).
- Both rule sets currently pass `photosPath => <root>/origin` with a `// #335 switches this to a storageRoot handler option.` comment: prod `$storageRoot . '/origin'`, dev `'/tmp/photos/origin'`.

## Steps

- [01 — Add PhotoImageResizer](proxy/01-add-photo-image-resizer.md)
- [02 — Submit writes origin, photo and snap](proxy/02-submit-writes-all-versions.md)
- [03 — Delete removes all versions](proxy/03-delete-removes-all-versions.md)
- [04 — Switch rules to storageRoot](proxy/04-switch-rules-to-storage-root.md)

## CI Checks
- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`, PHPUnit on `darthjee/tent-test:1.0.0`). Also run `phpcs` / `phpmd` from the tent-test image, as for earlier extension changes.

## Notes
- Out of the proxy agent's scope, for the architect when opening the PR: update `docs/agents/specs/photo/resizing.md` (drop "This is a proposal"; EXIF is now handled, not optional), `docs/agents/specs/photo/proxy-rules.md` (`storageRoot` is current state, not a proposal) and `docs/agents/specs/photo/examples.md` line 77 (use `'storageRoot' => $storageRoot`).
- If finalize fails after all three files are written, keep the current behavior (relay the backend response, leave the files). Rollback applies only to write/resize failures.
- Existing photos in prod still need a one-time `convert.sh` run for their resized versions; this issue only covers new uploads.

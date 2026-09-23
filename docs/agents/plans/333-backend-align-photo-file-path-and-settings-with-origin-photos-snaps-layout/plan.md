# Plan: Align photo settings, jobs and dev config with origin/photos/snaps layout

Issue: [333-backend-align-photo-file-path-and-settings-with-origin-photos-snaps-layout.md](../../issues/333-backend-align-photo-file-path-and-settings-with-origin-photos-snaps-layout.md)

## Overview
The backend `file_path` (`users/<uid>/items/<id>/<file>`) stays unchanged, because the proxy adds the layout prefixes (`docs/agents/specs/photo/index.md`). This issue moves the photo import jobs to scan `origin/` under `Settings.photos_path`. It also points the dev upload and delete rules at `/tmp/photos/origin`, which mirrors prod's interim `$storageRoot . '/origin'`, and seeds `dev_public_files/origin/` so dev has all three folders.

## Agents involved

- [backend](backend.md)
- [proxy](proxy.md)

## Shared contracts

- **Storage root:** `Settings.photos_path` (default `/tmp/photos`) is the storage root, not `origin/`. In dev, both the proxy and `oak_sidekiq` mount `./dev_public_files` at `/tmp/photos`. The mounts don't change.
- **Originals:** they live at `<storage root>/origin/users/<uid>/items/<id>/<file>`. The proxy writes and deletes them there, and the backend jobs read them from there.
- **`file_path`:** the value in the status-gate and `deletable` responses stays `users/<uid>/items/<id>/<file>`, with no `origin/` prefix.
- **Fixture:** `dev_public_files/origin/users/1/items/1/` holds `arduino1.png`, `arduino2.png` and `arduino3.png`, the same files as `photos/` and `snaps/`.

# Align photo settings, jobs and dev config with origin/photos/snaps layout

## Description
Align the backend and the dev environment with the photo storage layout from `docs/agents/specs/photo/index.md`. One storage root holds `origin/`, `photos/` and `snaps/`, and each one mirrors `users/<uid>/items/<id>/<file>`. Parent: #328.

Per the guide's path decision, the backend `file_path` (`users/<uid>/items/<id>/<file>`) does **not** change: the proxy adds the `origin/`, `photos/` and `snaps/` prefixes.

## Problem
- The dev upload rules (`docker_volumes/proxy_configuration/rules/uploads.php` and `deletes.php`) still use `photosPath => '/tmp/photos'`, so dev uploads land at `dev_public_files/users/...`, outside the layout. Prod already uses `$storageRoot . '/origin'` (#330).
- `CreateItemPhotosJob` and `ProcessUserItemPhotosJob` scan `Settings.photos_path/users/<uid>/items`. In dev that is `/tmp/photos/users/...`, which doesn't exist: the files are under `photos/users/...` and `snaps/users/...`.
- `dev_public_files` has no `origin/` folder.

## Expected Behavior
- In dev, an upload writes the original to `dev_public_files/origin/users/<uid>/items/<id>/<file>`, and deleting a photo removes it from there.
- The photo import jobs scan `origin/` under the storage root.
- The status-gate and `deletable` responses keep returning `file_path = users/<uid>/items/<id>/<file>`.
- `Oak::Photo::FileUrl` keeps building `<photos_server_url>/{photos,snaps}/users/<uid>/items/<id>/<file>`.

## Solution
- **proxy:** set `photosPath => '/tmp/photos/origin'` in the dev `uploads.php` and `deletes.php`, matching the prod interim. #335 later replaces it with `storageRoot`.
- **backend:** `Settings.photos_path` stays the storage root (`/tmp/photos`). `CreateItemPhotosJob` and `ProcessUserItemPhotosJob` join `origin/` before `users/<uid>/items`, because originals are the source of truth and `photos/` and `snaps/` are derived from them. Update their RSpec.
- **dev fixtures:** add `dev_public_files/origin/users/1/items/1/`, with copies of the sample item's fixtures, so dev has all three folders and the jobs find the sample photos.
- Leave `Items::PhotosController#file_path` and `Oak::Photo::FileUrl` unchanged, and keep specs pinning the current `file_path`.
- Update `docs/agents/specs/photo/` if anything here differs from it.

### Acceptance criteria
- [ ] `file_path` in the status-gate and `deletable` responses is still `users/<uid>/items/<id>/<file>` (RSpec).
- [ ] The jobs scan `<photos_path>/origin/users/...` (RSpec), and RuboCop passes.
- [ ] In dev, an upload lands under `dev_public_files/origin/users/...`, and a delete removes it.

### Out of scope
- Switching `OAK_PHOTOS_SERVER_URL` (#336).
- Resizing into `photos/` and `snaps/` (#335).
- Replacing the dev `oak_photos` httpd (localhost:3001) with the proxy's static rules; this goes with #336.

# Proxy Plan: Align photo settings, jobs and dev config with origin/photos/snaps layout

Main plan: [plan.md](plan.md)

## Shared contracts

- The dev storage root is `/tmp/photos` (the `./dev_public_files` mount). Originals go under `/tmp/photos/origin/<file_path>`.
- `file_path` from the backend stays `users/<uid>/items/<id>/<file>`.
- Fixture: `dev_public_files/origin/users/1/items/1/{arduino1,arduino2,arduino3}.png`.

## Implementation Steps

### Step 1 — Point the dev upload and delete rules at origin/
In `docker_volumes/proxy_configuration/rules/uploads.php` and `deletes.php`, set `'photosPath' => '/tmp/photos/origin'`. Add the same `// #335 switches this to a `storageRoot` handler option.` comment that the prod rules have. Don't change the static `photos.php` rule: it already serves `/photos` and `/snaps` from `/tmp/photos`.

### Step 2 — Seed origin/ fixtures and update docs
- Copy `dev_public_files/photos/users/1/items/1/*.png` into `dev_public_files/origin/users/1/items/1/`.
- In `docs/agents/specs/photo/proxy-rules.md`, change the dev `uploads.php` / `deletes.php` bullet to `photosPath => '/tmp/photos/origin'`, so it matches prod's interim.

## Files to Change
- `docker_volumes/proxy_configuration/rules/uploads.php`: `photosPath` → `/tmp/photos/origin`.
- `docker_volumes/proxy_configuration/rules/deletes.php`: `photosPath` → `/tmp/photos/origin`.
- `dev_public_files/origin/users/1/items/1/arduino{1,2,3}.png`: new fixtures.
- `docs/agents/specs/photo/proxy-rules.md`: update the dev rule description.

## CI Checks
- `proxy`: `docker-compose run --rm extension_tests vendor/bin/phpunit` (CI job running `vendor/bin/phpunit`). The dev config isn't covered by tests, so this only guards against regressions in the extension.

## Notes
- Manual dev check: upload a photo, then confirm it appears under `dev_public_files/origin/users/<uid>/items/<id>/`. Delete it and confirm it's removed. The photo won't show under `photos/` or `snaps/` until #335 adds resizing.
- Out of scope: replacing the dev `oak_photos` httpd (#336), and the `prod_base` `./prod_public_files/photos` mount.

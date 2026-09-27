# Proxy Plan: Proxy — /migrations/photos handler moving legacy files

Main plan: [plan.md](plan.md)

## Overview

Build `POST /migrations/photos?limit=N` as a custom Tent `RequestHandler`, following the existing `PhotoDelete*` pattern: a thin handler, a backend gateway, a filesystem worker and `PhotoPathGuard`. It moves the logged-in user's legacy `photos/`/`snaps/` files to the backend-assigned names, batch by batch.

## Context

- Backend contract (#380, `source/app/controllers/user/photos/migrations_controller.rb`):
  - `POST /user/photos/migration/prepare?limit=N` (Cookie forwarded) → `401` or `200 {"photos":[{"id","legacy_path","file_path"}],"remaining"}`.
  - `PATCH /user/photos/migration` (Cookie forwarded, `Content-Type: application/json`, body `{"migrated":[ids],"missing":[ids]}`) → `200`.
- Both paths are relative to each kind folder: `<root>/photos/<path>` and `<root>/snaps/<path>`.
- Prod: `~/photos.oak.ffavs.net` is a symlink to `/home/darthjee_oak/photos` (= `$storageRoot`), so `legacyRoot` equals `storageRoot` there. Dev: both are `/tmp/photos` (the `./dev_public_files` mount). `legacyRoot` stays a separate config key anyway.
- Response to the frontend:
  - `prepare` non-2xx → relayed as-is.
  - `PATCH` failure → `502`.
  - Otherwise `200 {"migrated": <int>, "missing": [ids], "failed": [{"id","reason"}], "remaining": <int>}`, where `remaining = prepare.remaining - migrated - count(missing)`, floored at 0.

## Steps

- [01 — Backend gateway](proxy/01-backend-gateway.md)
- [02 — Path validation and file mover](proxy/02-path-validation-and-file-mover.md)
- [03 — Migration request handler](proxy/03-migration-request-handler.md)
- [04 — Dev and prod rules/config](proxy/04-dev-and-prod-rules.md)
- [05 — PHPUnit specs](proxy/05-phpunit-specs.md)

## CI Checks

- `proxy/`: PHPUnit in the `darthjee/tent-test:1.0.0` image. Copy `proxy/extension` → `source/extension`, `proxy/extension_tests` → `source/tests/extension` and `proxy/prod_configuration` → `source/prod_configuration`, then run `vendor/bin/phpunit` (CI job: `proxy-tests`).

## Notes

- **Deploy caveat**: the real prod `locals.php` exists only on the server and is not uploaded by CI. The prod rule must fall back to `$legacyRoot ?? $storageRoot`, so the deploy does not break before `$legacyRoot` is added there manually.
- `PhotoPathGuard::resolve()` requires the parent directory to already exist (`realpath`). Resolve the source only after checking its directory exists. Create the target directory (`mkdir(..., 0775, true)`) before resolving the target.
- Legacy file names may contain spaces/accents. Do not restrict the file-name segment beyond: non-empty, no `/`, no `..`, no NUL.
- `rename()` silently overwriting an existing target is accepted (per the issue discussion).
- `limit` is taken from the incoming query string, cast to an int and forwarded; the backend clamps it. Nothing path-related comes from the request.
- `origin/` is out of scope; the frontend trigger is out of scope.

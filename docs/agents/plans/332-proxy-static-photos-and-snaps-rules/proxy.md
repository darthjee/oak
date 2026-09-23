# Proxy Plan: Proxy: static /photos and /snaps rules

Main plan: [plan.md](plan.md)

## Overview
Add static Tent rules for `GET /photos` and `GET /snaps` (`begins_with`) to the prod (`proxy/prod_configuration/`) and dev (`docker_volumes/proxy_configuration/`) configs. Register them right after `frontend.php` so they come before the redirect catch-all. Add a new extension middleware, `Oak\Proxy\CacheControlMiddleware`, that sets `Cache-Control: max-age=604800` on 2xx responses only.

## Context
- Tent 0.10.4 has no response-side cache-control middleware: `SetHeadersMiddleware` sets **request** headers, and `CacheStalenessMiddleware` needs `FileCacheMiddleware` plus an upstream host.
- Majora has one (`~/projetos/mine/majora-3/proxy/extension/lib/middlewares/CacheControlMiddleware.php`) that sets the header on **every** response. Oak's version must skip non-2xx responses: snaps are generated after the upload, and an early 404 must not be cached for 7 days.
- `Tent\Models\Response` exposes `httpCode()`, `isSuccessful()`, `headers()` and `setHeaders()`.
- File names contain a UUID (`Oak::Photo::CreateBuilder#unique_file_name`), so a 7-day max-age is safe.
- Prod: `$staticRoot` already exists in `locals.php`; the release dir has `photos` and `snaps` symlinks. No `locals.php` change.
- Dev: `./dev_public_files` is already mounted at `/tmp/photos` in `oak_proxy` and holds `photos/` and `snaps/`, so `location => '/tmp/photos'` resolves `/photos/...` to `dev_public_files/photos/...`.

## Steps

- [01 — Add CacheControlMiddleware](proxy/01-add-cache-control-middleware.md)
- [02 — Prod static photo rules](proxy/02-prod-static-photo-rules.md)
- [03 — Dev static photo rules](proxy/03-dev-static-photo-rules.md)
- [04 — Update photo docs](proxy/04-update-photo-docs.md)

## CI Checks
- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`)

## Notes
- Check that Tent's `static` handler returns 404 for a missing file under a matched prefix and does not fall through to the redirect rule. Test it manually in dev (`curl -i http://localhost:3000/photos/nope.jpg`). If it falls through, report it; do not work around it silently.
- The dev rule order changes only by inserting `photos.php` after `frontend.php`; full dev/prod order alignment belongs to #333.
- After deploy, the live `locals.php` needs no update.

# Issue: Release New Frontend

## Description

The new React/Vite frontend is ready and must be built and deployed through the CI/CD pipeline. Production currently lacks the static file serving and redirect rules that exist in the dev proxy configuration. This issue covers adding the frontend build step to CircleCI and bringing the production proxy configuration in sync with the dev setup (excluding dev mode / Vite server).

## Problem

- `.circleci/config.yml` has no job to build and upload frontend assets — only Rails and proxy files are released.
- `prod_proxy_conf/` is incomplete compared to `docker_volumes/proxy_configuration/`:
  - `rules/frontend.php` is missing — static files (`/assets`, `/`) are not served from disk.
  - `rules/redirects.php` is missing — bare `GET /path` requests are not redirected to `/#/path`.
  - `rules/backend.php` is a catch-all that proxies **everything** to the backend; it should only match `.json` endpoints.

## Expected Behavior

- On every version tag release, CI builds the React frontend, uploads the dist files, and releases them to production.
- The production proxy serves:
  - `/assets/**` and `/` → static files from `/var/www/html/static` (`rules/frontend.php`)
  - `*.json` requests → backend at `https://oak-api.ffavs.net/` (`rules/backend.php`)
  - bare `GET /path` → 302 redirect to `/#/path` (`rules/redirects.php`)

## Solution

### 1. Update `prod_proxy_conf/`

- **`rules/frontend.php`** (new) — static rule for `/assets` and `/` (no `FRONTEND_DEV_MODE` branch needed):
  - `/assets` → static files from `/var/www/html/static`
  - `/` (exact) → static `/index.html`
- **`rules/backend.php`** (update) — restrict matcher to `.json` endpoints only (matching dev config).
- **`rules/redirects.php`** (new) — copy from `docker_volumes/proxy_configuration/rules/redirects.php`, changing host to `https://oak-api.ffavs.net/`.
- **`configure.php`** (update) — require all three rules in order: `frontend.php`, `backend.php`, `redirects.php`.

### 2. Update `.circleci/config.yml`

- **Add `upload_fe_files` job** (modelled after weave's equivalent):
  - Uses a Vite-capable Docker image.
  - Runs `yarn install` then builds assets.
  - Uploads `dist/` to `$SSH_REMOTE_TEMP_DIR/static/`.
- **Wire `upload_fe_files`** as a dependency of the `release` job alongside `upload_proxy_files`.

## Notes

- `prod_proxy_conf/` is managed manually and deployed directly to the server — it is **not** part of the CI/CD pipeline.

## Benefits

- The new React frontend is fully served in production.
- The production proxy configuration mirrors the dev setup, eliminating routing discrepancies.
- CI pipeline enforces that frontend assets are always built and uploaded before a release lands.

---
See issue for details: https://github.com/darthjee/oak/issues/194

# Plan: Release New Frontend

## Overview

Two independent workstreams:
1. Bring `prod_proxy_conf/` in line with the dev proxy configuration (no dev/Vite mode) — to be deployed to the server manually.
2. Add a `upload_fe_files` CI job to `.circleci/config.yml` that builds the React/Vite frontend and uploads the dist files on each version-tag release.

## Context

- Dev proxy (`docker_volumes/proxy_configuration/`) has three rule files: `frontend.php`, `backend.php`, `redirects.php`.
- Prod proxy (`prod_proxy_conf/`) has only `backend.php`, which is a catch-all that proxies **everything** to `https://oak-api.ffavs.net/` — static files and redirect rules are missing.
- CI already has `upload_proxy_files` and `release` jobs but no job to build/upload frontend assets.
- The `release` job uses `darthjee/vite_weave-base:0.0.4`, which already has `deploy_frontend.sh` available.

---

## Implementation Steps

### Step 1 — Add `prod_proxy_conf/rules/frontend.php`

Create a static-file rule (non-dev branch only — no `FRONTEND_DEV_MODE` check needed):

- `/assets` (begins_with) → static files from `/var/www/html/static`
- `/` (exact) → static file `/index.html` (via `SetPathMiddleware`)

### Step 2 — Update `prod_proxy_conf/rules/backend.php`

Restrict the matcher to `.json` endpoints only (matching dev config):

```php
'matchers' => [
    ['uri' => '.json', 'type' => 'ends_with']
]
```

Remove the current catch-all `begins_with /` matcher.

### Step 3 — Add `prod_proxy_conf/rules/redirects.php`

Copy from `docker_volumes/proxy_configuration/rules/redirects.php`, replacing the backend host with `https://oak-api.ffavs.net/`.

### Step 4 — Update `prod_proxy_conf/configure.php`

Require all three rules in the correct order (frontend first, backend second, redirects last):

```php
require_once __DIR__ . '/rules/frontend.php';
require_once __DIR__ . '/rules/backend.php';
require_once __DIR__ . '/rules/redirects.php';
```

### Step 5 — Add `upload_fe_files` job to `.circleci/config.yml`

Add a new job modelled after weave's `upload_fe_files`:

```yaml
upload_fe_files:
  docker:
    - image: darthjee/vite_weave-base:0.0.4
  steps:
    - checkout
    - run:
        name: Set folder
        command: rm source -rf; cp frontend/* frontend/.??* ./ -r; rm frontend -rf
    - run:
        name: Yarn install
        command: yarn install
    - run:
        name: Build assets
        command: deploy_frontend.sh build
    - run:
        name: Generate key file
        command: deploy_frontend.sh generate_key_file
    - run:
        name: Generate folder
        command: SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/static/ deploy_frontend.sh generate_folder
    - run:
        name: Upload assets
        command: SOURCE=dist/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/static/ deploy_frontend.sh upload
```

### Step 6 — Wire `upload_fe_files` into the workflow

Add `upload_fe_files` to the workflow with the same tag filter as `upload_proxy_files`, and add it as a requirement of the `release` job:

```yaml
- upload_fe_files:
    requires: [test, checks, jasmine, frontend-checks]
    filters:
      tags:
        only: /\d+\.\d+\.\d+/
      branches:
        ignore: /.*/
- release:
    requires: [build-and-release, upload_proxy_files, upload_fe_files]
    ...
```

---

## Files to Change

- `prod_proxy_conf/rules/frontend.php` — new, static file serving rule
- `prod_proxy_conf/rules/backend.php` — restrict matcher to `.json` only
- `prod_proxy_conf/rules/redirects.php` — new, redirect catch-all
- `prod_proxy_conf/configure.php` — require all three rules in order
- `.circleci/config.yml` — add `upload_fe_files` job and update `release` dependencies

## Notes

- `prod_proxy_conf/` changes are deployed manually to the server and are **not** part of the CI pipeline.
- The `darthjee/vite_weave-base:0.0.4` image is already used by the `release` job in Oak, confirming `deploy_frontend.sh` is available.
- The `upload_fe_files` job sets the folder context the same way the `jasmine` job does (`cp frontend/* ./ -r`).

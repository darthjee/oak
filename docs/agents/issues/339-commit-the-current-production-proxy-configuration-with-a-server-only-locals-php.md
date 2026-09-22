# Issue: Commit the current production proxy configuration with a server-only locals.php

## Description
The production Tent proxy configuration exists only on the server. Commit it to the repo as `proxy/prod_configuration/`. Move the host-specific values into a single server-only `locals.php` that CI carries forward from the live release (the Majora pattern).

**This is a prerequisite for #330.** #330 adds the uploads/deletes rules and the extension deploy on top of this folder.

## Problem
- `upload_proxy_files` copies the whole live `configuration/` forward on every deploy (`TARGET=configuration/ deploy_frontend.sh copy_files`). The prod rules have no history, no review and no tests, and no deploy can change them.
- Current prod config (snapshot of the server):
  - `configure.php` has an `if (true) { frontend, backend, redirects } else { backend_legacy }` switch.
  - `rules/frontend.php` serves static files from `/home/darthjee_oak/oak.ffavs.net/static` for `GET /assets*` (begins_with). It also serves `GET /` (exact) with `SetPathMiddleware` → `/index.html`.
  - `rules/backend.php` is a `default_proxy` to `https://oak-api.ffavs.net/` for `*.json` (ends_with), with `skip_cache_header => 'X-Skip-Cache'`.
  - `rules/redirects.php` is a `default_proxy` to `https://oak-api.ffavs.net/`. It matches GET regex `/^\/(?!#\/)/` with `RedirectMiddleware` `/^(\/.*)$/` → `/#$1`.
  - `rules/backend_legacy.php` is a catch-all GET proxy to the same host. It is dead code.

## Expected Behavior
- On a tag deploy, the release's `configuration/` is made of the files committed in `proxy/prod_configuration/` plus the `locals.php` copied from the live release.
- Prod routing is unchanged: `/`, `/assets/*`, `*.json` and the `/#/` redirects behave as before.
- No host or path is hardcoded in the committed rules. The real `locals.php` is gitignored.
- A proxy test covers the prod rules with inline locals, and it passes in `proxy-tests`.

## Solution
- Add `proxy/prod_configuration/`:
  - `.keep`
  - `configure.php`: `require_once __DIR__ . '/locals.php'` **first**, then `rules/frontend.php`, `rules/backend.php`, `rules/redirects.php`, in that order. No `if/else`.
  - `locals.php.sample`:
    ```php
    <?php

    $backendHost = 'https://oak-api.ffavs.net/';
    $staticRoot = '/home/darthjee_oak/oak.ffavs.net';
    ```
  - `rules/frontend.php`, `rules/backend.php`, `rules/redirects.php`: the same behaviour as prod today, but reading `$backendHost` and `$staticRoot . '/static'`.
- Drop `backend_legacy.php` and the `if (true)` switch.
- `.gitignore`: add `proxy/prod_configuration/locals.php`, with a comment saying it is set only on production servers.
- `.circleci/config.yml`, job `upload_proxy_files`: replace the `copy_files` of the whole `configuration/` with the steps below. Oak's `deploy_frontend.sh` (in `darthjee/tent:0.10.4`) has **no `DEPLOY_PATH`**: `upload` rsyncs `$SOURCE` into `$SSH_REMOTE_TEMP_DIR`, and `copy_files` runs `cp -R $SSH_REMOTE_DIR/$TARGET $SSH_REMOTE_TEMP_DIR/`. So override `SSH_REMOTE_TEMP_DIR` per step, as `upload_fe_files` already does:
  1. `SOURCE=proxy/prod_configuration/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/configuration/ deploy_frontend.sh upload`
  2. `TARGET=configuration/locals.php SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/configuration deploy_frontend.sh copy_files`
- Test: add a PHPUnit test in `proxy/extension_tests/` that sets `$backendHost` and `$staticRoot` inline and requires the prod rule files directly (the real `locals.php` is never needed in tests). It must check that `GET /`, `GET /assets/...`, `*.json` and a bare `GET /path` redirect are matched by the right rule, in order. It runs in the existing `proxy-tests` job. That job only copies `proxy/extension` and `proxy/extension_tests` into the tent-test layout, so it must also make `proxy/prod_configuration/` reachable from the test.
- `.htaccess` needs no change: it comes from the Tent image upload, as it does today.
- Docs: add a short note on the server-only `locals.php`, the one-time bootstrap and the "update the live `locals.php` before tagging" rule. Update the "current state" sections of `docs/agents/specs/photo/proxy-rules.md` / `deployment.md` so #330 builds on this folder instead of creating it.

### Out of scope (belongs to #330 and later)
- uploads/deletes rules, photo/snaps static rules, deploying `proxy/extension/`, and extra locals (`$storageRoot`, `$maxUploadSizeBytes`).

### One-time server bootstrap (before the first tag)
- The repo owner creates `$SSH_REMOTE_DIR/configuration/locals.php` on the server **by hand**, from `locals.php.sample`. CI does not create it. Without it, `copy_files` fails on the first deploy. The docs and the PR description must call out this step before tagging.

## Benefits
- Prod routing is versioned and reviewed, and it gets deployed.
- It unblocks #330, which can add rules to a committed folder instead of editing the server by hand.

# Proxy Plan: Commit the current production proxy configuration with a server-only locals.php

Issue: [339-commit-the-current-production-proxy-configuration-with-a-server-only-locals-php.md](../../issues/339-commit-the-current-production-proxy-configuration-with-a-server-only-locals-php.md)

## Overview
Port the live prod config (snapshot in the issue) into `proxy/prod_configuration/`. The rules read `$backendHost` / `$staticRoot` from `locals.php`, which is gitignored and exists only on the server. Cover the rules with a tent-test PHPUnit spec that sets the locals inline. Switch the CircleCI deploy to upload the committed folder and copy only `locals.php` from the live release.

## Context
- Today `upload_proxy_files` (`.circleci/config.yml`) runs `TARGET=configuration/ deploy_frontend.sh copy_files`, which copies the whole live `configuration/` forward.
- Live config: `configure.php` has an `if (true)` switch that loads `frontend`, `backend` and `redirects` (the `else` branch with `backend_legacy` is dead). Hardcoded values: `https://oak-api.ffavs.net/` and `/home/darthjee_oak/oak.ffavs.net/static`. The exact rule contents are in the issue.
- Oak's `deploy_frontend.sh` (in `darthjee/tent:0.10.4`) has no `DEPLOY_PATH`. `upload` rsyncs `$SOURCE` into `$SSH_REMOTE_TEMP_DIR`, and `copy_files` runs `cp -R $SSH_REMOTE_DIR/$TARGET $SSH_REMOTE_TEMP_DIR/`. Target subfolders are chosen by overriding `SSH_REMOTE_TEMP_DIR`, as `upload_fe_files` does.
- The dev config (`docker_volumes/proxy_configuration/`) is **not** changed.
- Reference: Majora `proxy/prod_configuration/` and `proxy/extension/tests/configuration/DomainRouteOrderingTest.php`.

## Steps

- [01 — Add proxy/prod_configuration and gitignore locals.php](proxy/01-add-prod-configuration.md)
- [02 — Test the prod rules with inline locals](proxy/02-prod-rules-test.md)
- [03 — Deploy the committed config from CircleCI](proxy/03-circleci-deploy.md)
- [04 — Document locals.php and update the photo specs](proxy/04-docs.md)

## CI Checks
- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`)
- `.circleci/config.yml`: `circleci config validate` if available. Deploy jobs run only on tags, so check the new commands by reading them against `deploy_frontend.sh`.

## Notes
- Steps 03 and 04 touch root-level files (`.circleci/config.yml`, `.gitignore`, `docs/`), which are normally architect scope. They are kept here because they are small and tied to the proxy change.
- **Manual bootstrap:** before the first tag after merge, the repo owner creates `$SSH_REMOTE_DIR/configuration/locals.php` on the server by hand (CI does not). Without it, `copy_files` fails. Call this out in the PR description.
- Uploads/deletes rules, photo static rules, deploying `proxy/extension/` and extra locals belong to #330. Do not add them here.

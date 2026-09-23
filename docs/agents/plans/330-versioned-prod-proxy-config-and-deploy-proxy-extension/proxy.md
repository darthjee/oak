# Plan: Add photo upload/delete rules to prod proxy config and deploy proxy extension

Issue: [330-versioned-prod-proxy-config-and-deploy-proxy-extension.md](../../issues/330-versioned-prod-proxy-config-and-deploy-proxy-extension.md)

## Overview
Fix the prod 404 on photo submit/delete. #339 already committed the prod config (`frontend`, `backend`, `redirects`) and its deploy. This plan adds the `uploads`/`deletes` rules and their locals, tests them, deploys `proxy/extension/`, and updates the docs.

## Context
- Prod config: `proxy/prod_configuration/`. `configure.php` requires `locals.php` (server-only, gitignored), then `rules/frontend.php`, `backend.php`, `redirects.php`.
- Dev rules to mirror: `docker_volumes/proxy_configuration/rules/uploads.php` and `deletes.php` (`Oak\Proxy\PhotoSubmitRequestHandler` / `PhotoDeleteRequestHandler`, options `host`, `photosPath`, and `maxUploadSizeBytes` for submit).
- `upload_proxy_files` (`.circleci/config.yml`) uploads Tent's files (including an empty `extension/loader.php`), then the prod config, then carries `locals.php` forward. `proxy/extension/` is never uploaded.
- Decisions from the issue discussion: use `$storageRoot` (not `$photosPath`), `photosPath => $storageRoot . '/origin'` until #335; prod max upload is 10 MB; the extension upload is one more step of `upload_proxy_files` (not a separate job).

## Steps

- [01 — Add upload and delete rules to the prod config](proxy/01-add-prod-upload-delete-rules.md)
- [02 — Cover the new rules in ProdConfigurationRoutingTest](proxy/02-extend-prod-routing-test.md)
- [03 — Deploy proxy/extension/ in upload_proxy_files](proxy/03-deploy-extension.md)
- [04 — Update docs](proxy/04-update-docs.md)

## CI Checks
- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`)
- PHP lint/style checks that run on `proxy/` in the `checks` job, if any apply.

## Notes
- **Manual release steps (must be in the PR description):** before tagging, add `$storageRoot` (e.g. `$REMOTE_HOME/photos`) and `$maxUploadSizeBytes = 10 * 1024 * 1024` to the live `configuration/locals.php`; create `$REMOTE_HOME/photos/origin`; check Dreamhost's PHP `upload_max_filesize` and `post_max_size` are at least 10 MB. A missing local makes the rule files emit warnings / pass `null` into typed constructor params and break every request, not only uploads.
- Check how the image's `deploy_frontend.sh upload` builds the remote path before relying on the `SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/extension/` override (it is the same pattern #339 used for `configuration/`, which works).
- The handler classes must be loadable in the test: check how the existing extension tests get `Oak\Proxy\*` classes loaded (the `proxy-tests` job copies `proxy/extension` into the Tent source tree) and do the same in `ProdConfigurationRoutingTest`.
- Out of scope: #331 (link photo folders), #332 (static photo rules), #335 (`storageRoot` handler option).

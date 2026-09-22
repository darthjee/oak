# Plan: Docs: photo upload production guide in docs/agents/specs/photo

Issue: [329-docs-photo-upload-production-guide-in-docs-agents-specs-photo.md](../../issues/329-docs-photo-upload-production-guide-in-docs-agents-specs-photo.md)

## Overview

Write the temporary implementation guide for #328 under `docs/agents/specs/photo/`. The guide fixes the storage layout (`origin/`, `photos/`, `snaps/` under one storage root, with the proxy adding the prefixes to the unchanged backend `file_path`), the prod proxy rules, deploy linking, GD resizing and the rollout order. It covers only the production work and links to `docs/agents/photo_upload/` for the upload flow. This is docs only: no code and no specialist agent (owner: architect).

## Context

- Parent #328 was split into #329–#337. #330–#336 are implemented against this guide, and #337 deletes it.
- Current state, which the guide must describe accurately:
  - The dev proxy config (`docker_volumes/proxy_configuration/`) has `uploads.php` and `deletes.php` (handler classes `Oak\Proxy\PhotoSubmitRequestHandler` and `Oak\Proxy\PhotoDeleteRequestHandler`, `photosPath => '/tmp/photos'`). The prod config exists only on the server.
  - `.circleci/config.yml` `upload_proxy_files` uploads the Tent image's `/var/www/html/` and runs `TARGET=configuration/ deploy_frontend.sh copy_files`. `proxy/extension/` is never deployed.
  - Oak's `deploy_frontend.sh` (inside `darthjee/tent:0.10.4`): `link` = `ln -s $SOURCE $TARGET`; `release` swaps `$SSH_REMOTE_TEMP_DIR` into `$SSH_REMOTE_DIR`.
  - `Items::PhotosController#file_path` returns `users/<uid>/items/<id>/<file_name>`. `Oak::Photo::FileUrl` builds `photos_server_url/{photos,snaps}/users/<uid>/items/<id>/<file>`.
  - Prod photos currently come from `photos.oak.ffavs.net`, filled by `prod_public_files/convert.sh` (800x1064> photos, 215x215> snaps) + rsync.
  - The backend runs on Render (`scripts/deploy.sh`) and can't see the proxy disk. Dreamhost PHP has `gd` and `imagick`. Tent Docker images get GD in 1.0.0 (darthjee/tent#287).
- Docs rules (`docs/agents/contributing/index.md`): about 150 lines per file at most, a 1–3 sentence summary at the top, an entry in `docs/agents/summary.md`, and code snippets in a sibling `examples.md`.

## Steps

- [01 — Index and layout decision](plan/01-index.md)
- [02 — Proxy rules](plan/02-proxy-rules.md)
- [03 — Deployment and photo folder linking](plan/03-deployment.md)
- [04 — Resizing and delete](plan/04-resizing.md)
- [05 — Rollout](plan/05-rollout.md)
- [06 — Examples and summary index](plan/06-examples-and-summary.md)

## Notes

- The Majora reference notes live outside the repo (`~/messages/photo.md`, `photo-2.md`). Summarise what's relevant in the guide instead of linking to them.
- Rules and CircleCI snippets in the guide are proposals for #330–#335. Mark them as target state, not current state.
- Don't edit `docs/agents/photo_upload/`. Moving lasting content there is #337's job.
- Check the page summaries and relative links by hand. The repo has no markdownlint config, and Codacy runs markdownlint on PRs.

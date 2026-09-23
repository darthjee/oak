# Issue: Bump Tent images to 1.0.0

## Description
Upgrade Oak from `darthjee/tent:0.10.4` / `darthjee/tent-test:0.10.4` to `darthjee/tent:1.0.0` / `darthjee/tent-test:1.0.0`. Version 1.0.0 adds the PHP GD extension that photo resizing needs (see #328 and `docs/agents/specs/photo/resizing.md`).

The blocker, darthjee/tent#287, is closed. Both 1.0.0 images are on Docker Hub (amd64 and arm64). The 0.10.4 → 1.0.0 diff has only two changes: a docs update (darthjee/tent#286) and the GD addition (darthjee/tent#288). No existing rules or extension code should need changes.

Parent: #328.

## Problem
The resizing work under #328 needs GD, and the Tent 0.10.4 images don't include it. The proxy container, the proxy spec runner and the CI deploy images all still pin 0.10.4.

## Expected Behavior
- Every Tent image reference in the repo uses `1.0.0`.
- `php -m` in the `oak_proxy` container lists `gd`.
- Proxy specs (`proxy-tests` / `extension_tests`) pass on `tent-test:1.0.0` without changes to rules or to `proxy/extension`.

## Solution
Bump the image tag in:
- `docker-compose.yml`: the `oak_proxy` image (`darthjee/tent`) and the `extension_tests` image (`darthjee/tent-test`).
- `.circleci/config.yml`: `proxy-tests` (`tent-test`), plus `upload_proxy_files` and `link_photos` (`tent`).
- Docs that pin the version: `docs/agents/specs/photo/deployment.md` and `docs/agents/specs/photo/examples.md`. The `tent:latest` references under `docs/agents/external/tent/` stay as they are.

Then check that the proxy specs pass and that `gd` shows up in `php -m` in the local proxy container.

Out of scope: GD availability on the Dreamhost production PHP. Prod doesn't run the Docker image, so this bump only affects local/dev and CI.

### Acceptance criteria
- [ ] No references to `tent:0.10.4` / `tent-test:0.10.4` remain (outside `docs/agents/issues` and `docs/agents/plans`).
- [ ] `php -m` in the proxy container lists `gd`.
- [ ] Proxy specs pass on `tent-test:1.0.0`.

## Benefits
The proxy extension can use GD for photo resizing in dev and CI. This unblocks the remaining #328 resizing work.

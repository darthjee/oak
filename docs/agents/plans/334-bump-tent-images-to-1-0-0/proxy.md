# Proxy Plan: Bump Tent images to 1.0.0

Main plan: [plan.md](plan.md)

## Overview
Bump the Tent runtime and test images from `0.10.4` to `1.0.0` in local compose, CI and the photo spec docs. Then confirm that GD is present and that the existing proxy rules and extension still work unchanged.

## Context
- darthjee/tent#287 is closed, and `1.0.0` / `1.0.0-arm64` of both `darthjee/tent` and `darthjee/tent-test` are on Docker Hub.
- The 0.10.4 → 1.0.0 diff has only two changes: a docs update (darthjee/tent#286) and the GD addition (darthjee/tent#288). No rule or extension API changes are expected.
- Production (Dreamhost) runs its own PHP, not these images, so this change only affects dev and CI.

## Implementation Steps

### Step 1 — Bump image tags
Change `0.10.4` → `1.0.0` for every pinned Tent image:
- `docker-compose.yml`: `oak_proxy` (`darthjee/tent`) and `extension_tests` (`darthjee/tent-test`).
- `.circleci/config.yml`: `proxy-tests` (`darthjee/tent-test`), `upload_proxy_files` and `link_photos` (`darthjee/tent`).
- `docs/agents/specs/photo/deployment.md` (the `upload_proxy_files` and `link_photos` lines) and `docs/agents/specs/photo/examples.md` (the two `image:` lines).

Leave the `darthjee/tent:latest` / `tent-test:latest` references in `docs/agents/external/tent/` unchanged. Leave `docs/agents/issues` and `docs/agents/plans` unchanged too. Remove the "Tent 0.10.4 has no response-side…" note in `docs/agents/specs/photo/proxy-rules.md` only if 1.0.0 actually adds that capability; the diff says it doesn't, so it most likely stays as is.

### Step 2 — Verify
- `grep -rn "0\.10\.4" --exclude-dir=node_modules --exclude-dir=.git .` should return only `docs/agents/issues`, `docs/agents/plans` and the `proxy-rules.md` version note, if kept.
- `docker compose run --rm extension_tests` (or the PHPUnit command the `proxy-tests` job uses) passes on `tent-test:1.0.0`.
- `docker compose run --rm --entrypoint php oak_proxy -m | grep -i gd` lists `gd`.

## Files to Change
- `docker-compose.yml`: image tags for `oak_proxy` and `extension_tests`.
- `.circleci/config.yml`: image tags for `proxy-tests`, `upload_proxy_files` and `link_photos`.
- `docs/agents/specs/photo/deployment.md`: version references.
- `docs/agents/specs/photo/examples.md`: version references.

## CI Checks
- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`)

## Notes
- If a spec fails on 1.0.0, don't change it to make it pass. Report the failure: it would be a Tent regression outside this issue's scope.
- GD on the Dreamhost production PHP is out of scope. If resizing needs it in prod, that belongs in a separate issue under #328.

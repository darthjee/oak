# Plan: Use navi cache warmer as a service

Issue: [232-use-navi-cache-warmer-as-a-service.md](../../issues/232-use-navi-cache-warmer-as-a-service.md)

## Overview

Migrate oak's CI cache-warming step from booting a standalone `darthjee/navi-hey` engine per
build (against a single monolithic `.circleci/navi_config.yaml`) to driving majora's
already-deployed, persistent Navi server as a shared service, isolated by namespace. This
requires splitting the config into a `navi/` folder (entry point + per-domain resource files),
replacing the current CI job with two jobs (`wake-navi` + a rewritten `warm-up-cache`), updating
the existing local-dev docker-compose service and manual warm-up script to the new config path,
and refreshing the stale vendored Navi reference docs. Purely CI/infra/docs work — no
`source/` or `frontend/` changes, so this is a single, unsplit plan handled directly rather than
routed to the `backend`/`frontend` agents.

## Context

`warm-up-cache` (`.circleci/config.yml:272-279`) currently boots a fresh, standalone
`darthjee/navi-hey` engine on every CI run — a cold-start cost paid on every build to do the
same warm-up work majora already runs against a persistent server. `.circleci/navi_config.yaml`
is a single 90-line file with `web`/`workers`/`failure`, `clients`, and all 6 resource domains
inline, which doesn't match the split-config shape the hosted-server workflow expects.
`docs/agents/external/` (oak's vendored copy of the canonical Navi guides) predates the
hosted-server option entirely. Full technical detail and the decisions behind each piece below
live in the issue file linked above (config split shape, namespace value, CI job scripts,
docker-compose diff) — this plan sequences the actual file changes.

## Implementation Steps

### Step 1 — Copy and refresh vendored reference docs

Copy from `/Users/darthjee/projetos/mine/navi/docs/guides/` into
`docs/agents/external/`, preserving the `navi/`/`navi-client/` sibling-folder relative-link
structure:

- Overwrite `docs/agents/external/HOW_TO_USE_NAVI.md` with the current canonical version (adds
  Option D and the fourth integration mode — the existing copy is stale, not just incomplete).
- Add `docs/agents/external/navi/option-d-hosted-server.md` (new file).
- Add `docs/agents/external/HOW_TO_USE_NAVI-CLIENT.md` (new file).
- Add `docs/agents/external/navi-client/` folder: `cli-usage.md`, `installation.md`,
  `library-usage.md`, `reference.md`.

The rest of `docs/agents/external/navi/` is already current — leave untouched. This is a
one-time copy, not a scripted sync.

### Step 2 — Split the Navi config into `navi/`

Create `navi/navi_config.yaml` (entry point, keeps `web`/`workers`/`failure` from the current
`.circleci/navi_config.yaml`, replaces inline `clients:`/`resources:` with an `include:` list)
and `navi/resources/*.yml`:

- `navi/resources/categories.yml` — `categories`, `paginated_categories`, `category`,
  `category_items`, `paginated_category_items`, `category_item` (moved as-is from the current
  `resources:` block)
- `navi/resources/kinds.yml` — `kinds`, `paginated_kinds`, `kind`
- `navi/resources/user_navigation.yml` — `user_navigation`
- `navi/resources/clients.yml` — the `clients.default` block (`base_url: $OAK_PRODUCTION_URL`,
  `timeout: 20000`)

Each resource file gets a top-level `namespace: $OAK_NAVI_NAMESPACE` key. Do not delete
`.circleci/navi_config.yaml` yet — keep it until Step 4 rewires CI off of it, so the repo stays
in a working state at every commit.

### Step 3 — Update local-dev docker-compose service and manual script

- `docker-compose.yml`'s existing `oak_prod_navi` service (`docker-compose.yml:166-175`):
  change the `volumes:` mount from `.circleci/:/home/node/app` to `./navi/:/home/node/app`, and
  add `OAK_NAVI_NAMESPACE=$OAK_NAVI_NAMESPACE` to `environment:`. No other fields change.
- `scripts/warm_up_cache.sh` (existing manual dev utility, currently mounts `.circleci/` and
  runs `--config .circleci/navi_config.yaml`): repoint the volume mount to
  `$PROJECT_ROOT/navi:/home/node/app` and the `--config` flag to `navi_config.yaml`. No other
  behavior changes — it keeps doing a standalone `docker run` for ad hoc local testing.
- `.env.dev.sample`: add `OAK_NAVI_NAMESPACE=default`.

### Step 4 — Replace the CI job with `wake-navi` + rewritten `warm-up-cache`

- Add `scripts/wake_navi.sh` (polls `$NAVI_URL` until it stops returning `502`; copy majora's
  version as-is, no oak-specific changes).
- Add `scripts/warm_navi_cache.sh` — simplified from majora's version since oak has exactly one
  `$OAK_PRODUCTION_URL` (no loop over multiple targets): a `config` action that pushes all
  `navi/resources/*.yml` files via `navi-client -a config`, and an `engine-start` action that
  triggers a scoped warm-up run with a single `{"namespace": "$OAK_NAVI_NAMESPACE_BASE"}`
  target. See the issue file's "CI job split" section for the exact script content.
- In `.circleci/config.yml`: replace the `warm-up-cache` job block (currently lines 272-279,
  using `darthjee/navi-hey:1.6.0` to run `navi-hey --config .circleci/navi_config.yaml`
  directly) with the rewritten version that runs on `darthjee/navi-hey-client:latest`, sets
  `OAK_NAVI_NAMESPACE_BASE` in `$BASH_ENV`, then calls `scripts/warm_navi_cache.sh config` and
  `scripts/warm_navi_cache.sh engine-start`. Add a new `wake-navi` job (no `requires:`). Wire
  both into `workflows:` — `wake-navi` ungated, `warm-up-cache` keeping `requires: [release]`.

### Step 5 — Remove the old config file

Delete `.circleci/navi_config.yaml` now that nothing references it (Step 2 replaced its
content, Step 3 repointed both local-dev consumers, Step 4 repointed the CI job).

## Files to Change

- `docs/agents/external/HOW_TO_USE_NAVI.md` — refresh from canonical source (adds Option D)
- `docs/agents/external/navi/option-d-hosted-server.md` — new, copied from canonical source
- `docs/agents/external/HOW_TO_USE_NAVI-CLIENT.md` — new, copied from canonical source
- `docs/agents/external/navi-client/cli-usage.md` — new
- `docs/agents/external/navi-client/installation.md` — new
- `docs/agents/external/navi-client/library-usage.md` — new
- `docs/agents/external/navi-client/reference.md` — new
- `navi/navi_config.yaml` — new entry-point config
- `navi/resources/categories.yml` — new, split from `.circleci/navi_config.yaml`
- `navi/resources/kinds.yml` — new, split from `.circleci/navi_config.yaml`
- `navi/resources/user_navigation.yml` — new, split from `.circleci/navi_config.yaml`
- `navi/resources/clients.yml` — new, split from `.circleci/navi_config.yaml`
- `docker-compose.yml` — update `oak_prod_navi` service (volume mount + namespace env var)
- `scripts/warm_up_cache.sh` — repoint volume mount and `--config` path to `navi/`
- `.env.dev.sample` — add `OAK_NAVI_NAMESPACE=default`
- `scripts/wake_navi.sh` — new, copied from majora as-is
- `scripts/warm_navi_cache.sh` — new, simplified (no-loop) adaptation of majora's version
- `.circleci/config.yml` — replace `warm-up-cache` job, add `wake-navi` job, update `workflows:`
- `.circleci/navi_config.yaml` — deleted once nothing references it

## Notes

- New CircleCI **project** env vars (`$NAVI_URL`, `$NAVI_API_TOKEN`, `$OAK_NAVI_NAMESPACE=oak`)
  must be set manually in CircleCI Project Settings before `warm-up-cache` can succeed — this is
  an operational prerequisite outside this issue's code changes, not something any commit here
  can do.
- Standing up or operating the shared Navi server itself is majora's existing deployment,
  external to this issue.
- Verification: locally via `docker-compose up oak_prod_navi` + the Navi web UI at
  `http://localhost:3100`; in CI by triggering the release path and confirming `wake-navi` +
  `warm-up-cache` both succeed without colliding with majora's own next build on the shared
  server (namespace isolation working as intended).

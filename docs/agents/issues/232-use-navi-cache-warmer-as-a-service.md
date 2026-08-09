# Issue: Use navi cache warmer as a service

## Description

Migrate oak's CI cache-warming step from booting a standalone `darthjee/navi-hey` engine
per build (against a single monolithic `.circleci/navi_config.yaml`) to driving majora's
already-deployed, persistent Navi server as a shared service — the same model majora itself
already runs. CI stops booting its own engine; instead it pushes config and triggers a
scoped warm-up run against the shared server via the `navi-hey-client` CLI, isolated from
majora's own traffic (and from concurrent oak builds) purely by namespace. This also requires
splitting the existing single-file config into a `navi/` folder (entry point +
per-domain `navi/resources/*.yml`), since that's the format the hosted-server workflow expects.

## Problem

- `warm-up-cache` (`.circleci/config.yml:272-279`) boots a fresh, standalone `darthjee/navi-hey`
  engine on every CI run — a cold-start cost paid on every build, purely to run the same
  warm-up work majora already runs against a persistent server.
- `.circleci/navi_config.yaml` is a single 90-line file with `web`/`workers`/`failure`,
  `clients`, and all 6 resource domains inline — it doesn't match the split-config shape the
  hosted-server workflow (`navi-hey-client` + `include:`) expects, and doesn't scale cleanly as
  more domains get added.
- `docs/agents/external/` (oak's vendored copy of the canonical Navi guides) is stale: it
  predates the hosted-server option entirely (`HOW_TO_USE_NAVI.md` still says "Two integration
  modes are covered" instead of four, no Option D page, no `navi-client/` docs at all), so
  there's no reference material in-repo for the workflow this issue implements.

## Expected Behavior

- CI no longer boots a standalone Navi engine. Two jobs replace the current `warm-up-cache`:
  a non-blocking `wake-navi` job (pings the shared `$NAVI_URL` awake, gates nothing) and a
  rewritten `warm-up-cache` job that pushes config and triggers a scoped warm-up run against
  the shared server via `navi-client`, still gated on `requires: [release]`.
- oak's warm-up run is isolated from majora's traffic and from concurrent oak builds purely by
  a per-project, per-build `namespace:` value (`$OAK_NAVI_NAMESPACE_BASE`) — never colliding
  with `majora-*` namespaces on the shared server.
- The old single `.circleci/navi_config.yaml` is replaced by `navi/navi_config.yaml` (entry
  point) + `navi/resources/*.yml` (one file per domain, plus `clients.yml`), matching the
  shape majora already uses.
- Local dev is unaffected in kind — `docker-compose up oak_prod_navi` still boots its own
  standalone engine for local testing, just pointed at the new `navi/` config path.
- `docs/agents/external/` reference docs are refreshed to cover the hosted-server option and
  the `navi-hey-client` CLI, so future work on this config has accurate in-repo reference
  material.

## Solution

### Reference docs to copy in

`docs/agents/external/` already holds a partial, stale copy of the canonical Navi guides
(pulled from `/Users/darthjee/projetos/mine/navi/docs/guides/` at some earlier point, before
the hosted-server option existed). It needs to be brought up to date as part of this migration:

- `HOW_TO_USE_NAVI.md` — **stale, not just incomplete**: it currently says "Two integration
  modes are covered" and has no mention of Option D at all. Needs a real content refresh from
  the canonical file (which lists four modes, including Option D), not just a sibling file
  dropped in next to it.
- `navi/option-d-hosted-server.md` — missing. This is the actual "Navi as a service" page this
  issue is implementing.
- `HOW_TO_USE_NAVI-CLIENT.md` — missing entirely.
- `navi-client/` folder — missing entirely: `cli-usage.md`, `installation.md`,
  `library-usage.md`, `reference.md`.

The rest of `docs/agents/external/navi/` (`option-a-docker-image.md`, `option-b-nodejs-image.md`,
`option-c-circleci-executor.md`, `paginated-actions.md`, `prerequisites.md`, `reference.md`,
`warming-html-assets.md`) is already present and current — no change needed there.

This is a **one-time copy**, not a synced/scripted mirror. These are stable external reference
docs; if the canonical navi guides change again later, re-syncing is a manual follow-up, not
something this issue needs to automate. After copying, preserve the relative-link structure
between the hub files (`HOW_TO_USE_NAVI.md` ↔ `navi/`, `HOW_TO_USE_NAVI-CLIENT.md` ↔
`navi-client/`) so links keep resolving from `docs/agents/external/`.

### Config split shape

The current `.circleci/navi_config.yaml` (90 lines) has 6 resource domains, which map onto
3 top-level chains plus 1 standalone resource:

- **categories chain**: `categories` -> `paginated_categories` -> `category` +
  `category_items` -> `paginated_category_items` -> `category_item` (the item flow is only ever
  reached via `category_slug` carried forward from the categories chain, so it stays nested in
  the same file rather than being split out)
- **kinds chain**: `kinds` -> `paginated_kinds` -> `kind`
- **user_navigation**: standalone, unparameterized (`/user/categories.json`)

Split into `navi/resources/*.yml`, one file per top-level chain (mirrors majora's
one-file-per-entity pattern):

- `navi/resources/categories.yml` — `categories`, `paginated_categories`, `category`,
  `category_items`, `paginated_category_items`, `category_item`
- `navi/resources/kinds.yml` — `kinds`, `paginated_kinds`, `kind`
- `navi/resources/user_navigation.yml` — `user_navigation`
- `navi/resources/clients.yml` — the `clients.default` block (base URL, timeout)

`navi/navi_config.yaml` keeps `web`/`workers`/`failure` as-is and replaces the inline
`clients:`/`resources:` blocks with:

```yaml
include:
  - resources/categories.yml
  - resources/kinds.yml
  - resources/user_navigation.yml
  - resources/clients.yml
```

Each resource file needs a top-level `namespace:` key (same env var name across all files) —
the actual env var name and value are decided below, under "Namespace & CI env vars".

### Namespace & CI env vars

New namespace env var: **`OAK_NAVI_NAMESPACE = "oak"`** — mirrors majora's own naming
(`NAVI_NAMEPACE`, typo and all, kept internal to majora — oak's own var doesn't need to match
that spelling) but prefixed per-project and spelled correctly. At CI time,
`warm-up-cache` builds `OAK_NAVI_NAMESPACE_BASE="${OAK_NAVI_NAMESPACE}-${CIRCLE_WORKFLOW_WORKSPACE_ID}"`
before invoking `navi-client`, same pattern majora uses — this is what keeps oak's cache
warm-up from colliding with majora's (or with concurrent oak builds) on the shared server.
`navi/resources/*.yml` reference the var by name (not the literal `oak` value) via the
`namespace:` key, so each file just needs `namespace: $OAK_NAVI_NAMESPACE` (matches majora's
`namespace: $NAVI_NAMEPACE` convention in its own resource files).

New CircleCI **project** env vars to set (Project Settings → Environment Variables, not
committed to the repo):

| Var | Value | Notes |
|---|---|---|
| `$NAVI_URL` | same shared Navi server URL majora uses | get from whoever owns the Navi deployment — operational setup, not a code change |
| `$NAVI_API_TOKEN` | same shared bearer token majora uses | same source as above |
| `$OAK_NAVI_NAMESPACE` | `oak` | new, oak-specific |

Existing client env var **`$OAK_PRODUCTION_URL`** (already referenced in the current
`clients.default.base_url`) carries over unchanged into `navi/resources/clients.yml`.

Local dev: `.env.dev.sample` currently has no Navi-related entries at all. Add an
`OAK_NAVI_NAMESPACE=default` line there, matching majora's own local-default convention.

### CI job split (wake + warm-up)

Replace the current single `warm-up-cache` job (`.circleci/config.yml:272-279`, using
`darthjee/navi-hey:1.6.0` to boot a standalone engine per build) with two jobs, adapted from
majora's templates.

**`wake-navi`** — non-blocking, no `requires:`, doesn't gate or get gated by anything:

```yaml
  wake-navi:
    docker:
      - image: cimg/base:current
    steps:
      - checkout
      - run:
          name: Wake up Navi
          command: scripts/wake_navi.sh
```

`scripts/wake_navi.sh` copies majora's version as-is (polls `$NAVI_URL` until it stops
returning `502`) — no oak-specific changes needed there.

**`warm-up-cache`** — rewritten to run on `darthjee/navi-hey-client:latest` and drive the
remote server via `navi-client`, still `requires: [release]`:

```yaml
  warm-up-cache:
    docker:
      - image: darthjee/navi-hey-client:latest
    steps:
      - checkout
      - run:
          name: Set Navi namespace base
          command: echo 'export OAK_NAVI_NAMESPACE_BASE="${OAK_NAVI_NAMESPACE}-${CIRCLE_WORKFLOW_WORKSPACE_ID}"' >> "$BASH_ENV"
      - run:
          name: Push navi config
          command: scripts/warm_navi_cache.sh config
      - run:
          name: Start navi engine
          command: scripts/warm_navi_cache.sh engine-start
```

`scripts/warm_navi_cache.sh` — **simplified from majora's version**: majora loops over
`$MAJORA_PRODUCTION_URLS` (comma-separated) because it warms multiple production targets under
separate namespace slices. Oak has exactly one `$OAK_PRODUCTION_URL`, so the loop is dropped
(can be reintroduced later if oak ever needs multiple targets):

```bash
#!/bin/bash

RESOURCE_FILES=(
  navi/resources/categories.yml
  navi/resources/kinds.yml
  navi/resources/user_navigation.yml
  navi/resources/clients.yml
)

function push_config() {
  FILE_ARGS=()
  for f in "${RESOURCE_FILES[@]}"; do
    FILE_ARGS+=(--file "$f")
  done

  OAK_NAVI_NAMESPACE="$OAK_NAVI_NAMESPACE_BASE" \
    navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a config "${FILE_ARGS[@]}"
}

function start_engine() {
  navi-client -b "$NAVI_URL" -t "$NAVI_API_TOKEN" -a engine-start \
    -p "{\"targets\":[{\"namespace\":\"${OAK_NAVI_NAMESPACE_BASE}\"}]}"
}

ACTION=$1

case $ACTION in
  "config")
    push_config
    ;;
  "engine-start")
    start_engine
    ;;
  *)
    $ACTION
    ;;
esac
```

Wire into `workflows:` alongside the existing `release`/`deploy` jobs: `wake-navi` with no
`requires:`, `warm-up-cache` keeping its current `requires: [release]`.

### Existing manual script: `scripts/warm_up_cache.sh`

Oak already has `scripts/warm_up_cache.sh` — a standalone manual dev-utility (not referenced
from CI or docker-compose) that runs `docker run darthjee/navi-hey ... --config
.circleci/navi_config.yaml` for an ad hoc local warm-up. This is separate from both the
`oak_prod_navi` docker-compose service and the new CI `warm-up-cache` job, and would silently
break once `.circleci/navi_config.yaml` is deleted. Update it in place:

- Change the mounted volume from `$PROJECT_ROOT/.circleci:/home/node/app/.circleci` to
  `$PROJECT_ROOT/navi:/home/node/app`
- Change `--config .circleci/navi_config.yaml` to `--config navi_config.yaml`

No other behavior changes — it keeps running a standalone `docker run` against
`darthjee/navi-hey`, independent of both the docker-compose service and the shared-server CI
path; it's just repointed at the new split config location.

### docker-compose local dev service

`docker-compose.yml` already has an `oak_prod_navi` service (`docker-compose.yml:166-175`,
port 3100) — no new service needed, just an update in place. This container is unaffected by
the CI change above; it keeps booting its own standalone `darthjee/navi-hey` engine for local
testing.

Current:

```yaml
  oak_prod_navi:
    image: darthjee/navi-hey:1.6.0
    volumes:
      - .circleci/:/home/node/app
    command: navi-hey --config navi_config.yaml
    environment:
      - OAK_PRODUCTION_URL=$OAK_PRODUCTION_URL
      - NAVI_PORT=3000
    ports:
      - 0.0.0.0:3100:3000
```

Updated:

```yaml
  oak_prod_navi:
    image: darthjee/navi-hey:1.6.0
    volumes:
      - ./navi/:/home/node/app
    command: navi-hey --config navi_config.yaml
    environment:
      - OAK_PRODUCTION_URL=$OAK_PRODUCTION_URL
      - NAVI_PORT=3000
      - OAK_NAVI_NAMESPACE=$OAK_NAVI_NAMESPACE
    ports:
      - 0.0.0.0:3100:3000
```

Only two changes: `volumes:` mount moves from `.circleci/` to the new `./navi/` folder, and
`OAK_NAVI_NAMESPACE` is added to `environment:` so the locally-run engine picks up the same var
the resource files reference. Image, command, port, and `OAK_PRODUCTION_URL` stay as they are.
Once `navi/` replaces `.circleci/navi_config.yaml`, the old file can be deleted.

### Scope boundaries

**In scope**: copying/refreshing the vendored reference docs, splitting the config into
`navi/navi_config.yaml` + `navi/resources/*.yml`, updating the `oak_prod_navi` docker-compose
service, updating the existing `scripts/warm_up_cache.sh` manual utility to point at the new
`navi/` path, replacing the single `warm-up-cache` CI job with `wake-navi` + a rewritten
`warm-up-cache`, and defining oak's own namespace value/env var references in the repo's config.

**Out of scope**: standing up or operating the shared Navi server itself — that's majora's
existing deployment, owned externally to this issue. Also out of scope: actually creating the
new CircleCI project env vars (`$NAVI_URL`, `$NAVI_API_TOKEN`, `$OAK_NAVI_NAMESPACE`) — that's a
manual CircleCI dashboard step (Project Settings → Environment Variables), not something this
issue's code changes can do; it's a deployment prerequisite this issue depends on, tracked as a
follow-up action rather than a code task.

### Alternative solutions considered

- **Keep the current per-build standalone engine** (status quo) — rejected: this is the exact
  problem being solved (cold-start engine boot on every CI run).
- **Stand up a dedicated Navi server for oak** instead of sharing majora's — rejected: majora's
  shared server already exists and namespace isolation (see "Namespace & CI env vars") makes
  sharing safe, so a dedicated deployment would just be new infrastructure to operate for no
  added benefit.

### Testing strategy

- **Local**: `docker-compose up oak_prod_navi`, then open the Navi web UI at
  `http://localhost:3100` and confirm the split `navi/resources/*.yml` resources load correctly.
- **CI**: trigger the release path and confirm `wake-navi` runs early without blocking or being
  blocked by anything else, `warm-up-cache` succeeds after `release` finishes (pushing config
  and starting the engine scoped to `$OAK_NAVI_NAMESPACE_BASE` only), and majora's own next
  build on the shared server still passes afterwards — i.e. oak's namespace never collided with
  majora's.

### Security & performance considerations

- `$NAVI_API_TOKEN` is a bearer token for a **shared, multi-tenant** service — must be set as a
  masked CircleCI secret, never committed to the repo.
- Namespace isolation (`$OAK_NAVI_NAMESPACE_BASE`, unique per project + build) is the mechanism
  that prevents oak's warm-up run from touching or leaking into majora's cache slice on the
  shared server, and vice versa.
- Performance-wise, this removes the per-build cold-start cost of booting a standalone engine;
  the shared server may still need a cold-start wake on its own schedule, which is what
  `wake-navi` absorbs non-blockingly before `warm-up-cache` runs.

## Benefits

- Removes the per-build cold-start cost of booting a standalone Navi engine on every CI run.
- Reuses majora's already-deployed, persistent infrastructure instead of standing up and
  maintaining a dedicated Navi server for oak.
- Namespace isolation makes the shared server safe to use without risk of cross-project cache
  collisions.
- Split, per-domain config files (`navi/resources/*.yml`) scale more cleanly than one growing
  monolithic file as more resource domains get added.
- In-repo reference docs are brought current with the hosted-server workflow and the
  `navi-hey-client` CLI, so future contributors have accurate documentation to work from.

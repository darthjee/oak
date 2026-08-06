# Issue: Add docker image build to CI pipeline

## Description

oak's CircleCI pipeline currently only **pulls** pre-built, version-pinned base images — it never builds or
publishes them. Building/publishing a base image today is a fully manual, local step:

```bash
make build-base   # docker build -f dockerfiles/$(PROJECT)-base/Dockerfile source
make push-base     # + docker push, requires local Docker Hub login
```

(`Makefile`, `PROJECT` defaults to `oak`; override e.g. `PROJECT=production_oak` / `PROJECT=circleci_oak` to
target the other base images.)

This issue automates that: have CircleCI build and publish oak's base images itself on tagged releases, the
same way the sibling project `majora` (and the shared `docker` image repo one level further upstream) already
do it. Full investigation of both reference implementations is written up at
`/Users/darthjee/projetos/mine/majora/answers.md` and `/Users/darthjee/projetos/mine/docker/answers.md`.

### Where oak's base images currently point (baseline to preserve/seed)

| Image | Dockerfile | Current pin |
|---|---|---|
| `oak-base` | `dockerfiles/oak-base/Dockerfile` | `FROM darthjee/scripts:0.8.0 as scripts` / `FROM darthjee/taa:1.5.0 as base` |
| `production_oak-base` | `dockerfiles/production_oak-base/Dockerfile` | `FROM darthjee/scripts:0.8.0` / `FROM darthjee/production_taa:1.5.0` |
| `circleci_oak-base` | `dockerfiles/circleci_oak-base/Dockerfile` | `FROM darthjee/scripts:0.8.0` / `FROM darthjee/circleci_taa:1.5.0` |
| `vite_oak-base` | `dockerfiles/vite_oak-base/Dockerfile` | `FROM darthjee/scripts:0.5.3` / `FROM darthjee/node:0.2.1` |

Consumers pin oak's own base images by exact version today:
- `dockerfiles/oak/Dockerfile`: `FROM darthjee/oak-base:0.1.0`
- `dockerfiles/production_oak/Dockerfile`: `FROM darthjee/production_oak-base:0.1.0 as base`
- `.circleci/config.yml`: `darthjee/circleci_oak-base:0.0.4` (referenced twice, for the two CircleCI docker-executor jobs that run specs)

No `version` file exists yet in oak's repo root — this issue introduces one.

## Problem

Whoever needs a new base image version has to build it locally, push by hand (requiring local Docker Hub
login), and then update every Dockerfile/CI reference that pins the old version. There's no automation, and
one of the four current CI consumers (`upload_fe_files`/`release`) is actually pinned to the wrong image
entirely (`darthjee/vite_weave-base:0.0.4`, an unrelated leftover from a different project), which this issue
also corrects as part of wiring the fix `vite_oak-base` image into CI.

## Expected Behavior

Once this lands, CircleCI builds and publishes oak's base images itself on tagged releases — mirroring
majora's proven mechanism — instead of relying on a manual `make build-base`/`make push-base` step.

### Scope

All four base images are in scope: `oak-base`, `production_oak-base`, `circleci_oak-base`, `vite_oak-base`.
Each has a real, load-bearing consumer once published automatically:

| Base image | Real consumer today | Built by |
|---|---|---|
| `circleci_oak-base` | `.circleci/config.yml` `test`/`checks` jobs (pinned `:0.0.4`) | CircleCI itself, every run — the same-run `requires:` ordering (see below) genuinely matters here |
| `oak-base` | `dockerfiles/oak/Dockerfile` → tagged `darthjee/oak`, run by docker-compose's `base_build`/`oak_app`/`oak_sidekiq`/etc. dev containers | Local dev only (`docker-compose`), not CI — payoff is removing the manual `make push-base` step, not same-run ordering |
| `production_oak-base` | `dockerfiles/production_oak/Dockerfile` | An external deploy service triggered by `scripts/deploy.sh deploy` (not oak's own CircleCI) — same kind of payoff as `oak-base` |
| `vite_oak-base` | `dockerfiles/vite_oak/Dockerfile` — **intended** to be built by oak's FE asset build/deploy jobs (`upload_fe_files`, `release`), mirroring majora's identical jobs running inside `darthjee/vite_majora-base:0.1.0`. (`jasmine`/`frontend-checks` run in the unrelated, shared `darthjee/circleci_node:0.2.1` in both majora and oak — not part of this swap.) | Currently **not** built by CI at all — `upload_fe_files`/`release` instead run inside `darthjee/vite_weave-base:0.0.4`. This issue fixes that: rewires `upload_fe_files`/`release` to `darthjee/vite_oak-base:<version>` |

### Ordering

Confirmed against majora's actual `.circleci/config.yml` — every job that pulls a base image by fixed tag
declares `requires: [release-<image>, release-<image>-arm64]` against that image's `release-image` job
instance(s). oak replicates this 1:1: `test`/`checks` require `release-circleci_oak-base(-arm64)`;
`jasmine`/`frontend-checks`/`upload_fe_files`/`release` require `release-vite_oak-base(-arm64)` (majora wires
this on `jasmine`/`frontend-checks` too even though they don't consume that image — a loose/grouping
dependency, mirrored here for consistency with the reference implementation); the production deploy trigger
requires `release-production_oak-base(-arm64)`.

### Multi-arch

Split by actual usage rather than a blanket choice across all four images:

- **`oak-base` and `vite_oak-base` get amd64 + arm64.** These are the images run locally every day via
  `docker-compose` on the developer's Apple Silicon (arm64) Mac. Publishing amd64-only would force Docker
  Desktop to fall back to QEMU emulation for daily dev containers — real dev-loop slowdown plus the class of
  bugs that come with emulated native extensions (Bundler gems, Node native modules). This is where multi-arch
  actually pays off, not just mirrors majora/docker.
- **`circleci_oak-base` and `production_oak-base` stay amd64-only.** `circleci_oak-base` only ever runs inside
  CircleCI's `docker:`-executor jobs (`test`/`checks`) — standard amd64 infra. `production_oak-base` only ever
  runs on the external deploy service's infra — also standard amd64 cloud infrastructure. arm64 buys nothing
  for either today.
- This also keeps job count/`requires:` wiring down versus doubling all four images the way majora/docker do —
  only two of the four `release-image` job families get a `-arm64` variant.

## Solution

### Reference mechanism (from `majora`, condensed)

`.circleci/config.yml` defines a parameterized job:

```yaml
jobs:
  release-image:
    parameters:
      image: { type: string }
      arch: { type: string, default: "" }
    machine: true
    steps:
      - checkout
      - run:
          name: Set up QEMU
          command: bin/image.sh qemu << parameters.image >>
      - run:
          name: Release
          command: bin/image.sh push << parameters.image >> << parameters.arch >>
```

...instantiated once per base image (majora does it × 2 for an amd64 + `-arm64` variant each). Other jobs that
consume a base image by fixed version tag `requires:` the matching `release-image` job(s) purely for
**ordering** — so a version bump is guaranteed published before anything tries to pull it in the same run.

`bin/image.sh` (majora's version, ported and adapted for oak — see "Adaptations needed" below):

```bash
function image_version() {
  local image=$1
  cat version | grep "^${image}=" | sed -e "s/${image}=//g"
}

function skip_if_not_tag() {
  if [ -z "$CIRCLE_TAG" ]; then
    echo "Not a tag build, skipping."
    exit 0
  fi
}

function skip_if_unchanged() {
  local image=$1
  local prev_tag
  prev_tag=$(git tag --sort=-creatordate | awk 'NR==2{print; exit}')
  if [ -z "$prev_tag" ]; then
    echo "No previous tag found, proceeding with release of ${image}."
    return 0
  fi
  if git diff --quiet "$prev_tag"..HEAD -- "dockerfiles/${image}/"; then
    echo "No changes in dockerfiles/${image}/ since ${prev_tag}, skipping."
    exit 0
  fi
}

function build() {
  local image=$1 arch=$2
  local version; version=$(image_version "$image")
  local platform tag_suffix
  if [ -n "$arch" ]; then platform="linux/$arch"; tag_suffix="-$arch"
  else platform="${PLATFORM:-linux/amd64}"; tag_suffix=""; fi
  local latest_tag="$DOCKER_ID_USER/$image:latest${tag_suffix}"
  local cached_tag="$DOCKER_ID_USER/$image:cached${tag_suffix}"
  local version_tag="$DOCKER_ID_USER/$image:${version}${tag_suffix}"
  docker tag "$latest_tag" "$cached_tag" 2>/dev/null || true
  docker rmi "$latest_tag" 2>/dev/null || true
  docker build --platform "$platform" -f "dockerfiles/$image/Dockerfile" . -t "$latest_tag"
  docker tag "$latest_tag" "$version_tag"
  docker images | grep -q "$cached_tag" && docker rmi "$cached_tag"
}

function push() {
  local image=$1 arch=$2
  local version; version=$(image_version "$image")
  local tag_suffix; [ -n "$arch" ] && tag_suffix="-$arch" || tag_suffix=""
  skip_if_not_tag
  skip_if_unchanged "$image"
  echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin
  build "$image" "$arch"
  docker push "$DOCKER_ID_USER/$image:latest${tag_suffix}"
  docker push "$DOCKER_ID_USER/$image:${version}${tag_suffix}"
}
```

`setup_qemu` (called by the `qemu` action, needed for the two multi-arch images):

```bash
function setup_qemu() {
  local image=$1
  skip_if_not_tag
  skip_if_unchanged "$image"
  docker run --privileged --rm tonistiigi/binfmt --install all
}
```

Both guards run **before** `docker login`/QEMU install, so branch builds and unchanged-image tag builds never
touch Docker Hub or pay the (privileged) QEMU-setup cost.

### Adaptations needed for oak (do not port verbatim)

- **Build context differs.** Majora's `docker build ... -f dockerfiles/$image/Dockerfile .` uses the repo root
  as context. oak's existing `Makefile` instead builds per-image with an explicit context (`docker build -f
  dockerfiles/$(PROJECT)-base/Dockerfile source`) — the ported `build()` needs an explicit image→context
  mapping: `source` for the three Rails images, `frontend` for `vite_oak-base`.
- **Upstream image family differs.** Majora pins `darthjee/django` / `darthjee/circleci_django` (Python/Django
  stack); oak pins `darthjee/taa` / `darthjee/circleci_taa` / `darthjee/production_taa` (Ruby/Rails stack) —
  same `darthjee/scripts` helper stage in both. Not a blocker, just don't copy majora's table of upstream
  images verbatim into oak's version.
- **`version` file needs creating**, seeded with the *current* live versions (`oak-base=0.1.0`,
  `production_oak-base=0.1.0`, `circleci_oak-base=0.0.4`, `vite_oak-base=0.0.1`) so the first CI run after
  merge doesn't silently republish everything under a wrong version — see "Backward compatibility" below.
- **`skip_if_not_tag`, not a workflow-level tag filter** — resolved. Majora's script checks `$CIRCLE_TAG`
  itself, keeping the `release-image` job filter permissive so it also runs (and no-ops) on branches. The
  `docker` repo instead gates the whole release workflow at the filter level and skips the in-script check as
  redundant — that only works because its release jobs aren't `requires:`-coupled to its test suite. oak's
  `test`/`checks`/`jasmine`/`frontend-checks`/`upload_fe_files`/`release` jobs *do* `requires:` the matching
  `release-image` job(s) (see "Ordering" above), and those test jobs already run on every branch push — so
  `release-image` must also be scheduled on every branch push (and self-no-op via `skip_if_not_tag`) for
  `requires:` to resolve at all. oak therefore uses majora's `skip_if_not_tag` style, not `branches: ignore`.

### Backward compatibility

- **Day-one is a safe no-op.** The `version` file is seeded with the current live versions. Since this issue's
  PR doesn't touch any `dockerfiles/<image>/` content, `skip_if_unchanged` will skip publishing all four images
  on the very first tag build after merge — nothing gets silently re-pushed or overwritten on Docker Hub.
  Publishing only fires the next time a `dockerfiles/<image>/` change and its `version` bump land together.
- **`vite_weave-base` → `vite_oak-base` swap is a correctness fix, not a new risk.** Only `upload_fe_files` and
  `release` are affected (`jasmine`/`frontend-checks` stay on the unrelated, shared `circleci_node:0.2.1`,
  unchanged). `requires:`-ordering already guarantees `vite_oak-base` is built and pushed before those jobs
  pull it, matching majora's proven pattern. And since `vite_oak-base`'s own Dockerfile is already built
  against oak's actual `frontend/package.json`/`yarn.lock`, it's a better fit for building oak's frontend than
  the foreign `vite_weave-base` image it replaces — no separate pre-verification step needed beyond watching
  the first real tag build.
- **`requires:` coupling changes failure blast radius — accepted.** A Docker Hub push failure on a tag build
  will now block `test`/`checks`/`jasmine`/`frontend-checks`/`upload_fe_files`/`release` too, even for the ones
  that only pull an already-published fixed tag and don't strictly need the fresh push to succeed. This is the
  same trade-off majora/docker already run with in production — accepted as-is rather than adding complexity
  to soften it.
- **Minor CI cost regression, accepted.** Every branch/PR push now also spins up a `machine: true` executor per
  release job (4 images, doubled for the two multi-arch ones) just to no-op via `skip_if_not_tag` — extra
  wall-clock/cost per push, not just tag pushes. Not raised as a blocker; noted so it isn't a surprise later.

### Edge cases

- **Tag filter scoped to semver, deviating from majora.** Majora's `release-image` jobs use a permissive
  `*all_tags` (`/.*/`) filter, and `skip_if_unchanged`'s `prev_tag=$(git tag --sort=-creatordate | awk
  'NR==2{...}')` picks "previous tag" from *all* tags, unscoped. A stray non-release tag between two real
  releases would both trigger an unintended build/push attempt and shift the diff baseline to the wrong
  commit. oak scopes `release-image`'s tag filter to its own existing convention, `\d+\.\d+\.\d+` (matching
  the `filters:` already used by `build-and-release`/`upload_*`/`release` today), instead of porting `/.*/`
  verbatim.
- **`image_version()` hardened to fail loudly.** Majora's/`docker`'s version silently returns an empty string
  for a typo'd or missing image name in `version`, producing a malformed tag (`darthjee/oak-base:`, no
  version) instead of failing. oak's port adds an explicit check — `exit 1` with a clear error if
  `image_version` comes back empty — rather than inheriting the silent-bad-tag footgun.
- **No-previous-tag case** (`prev_tag` empty → proceed unconditionally) is a known, inherited behavior from
  majora's script, not something to change — not a practical risk for oak given its long, clean semver tag
  history (`1.8.0`, `1.7.9`, …), so this path essentially never triggers in practice.
- **Per-image build context** (`source` for the three Rails images, `frontend` for `vite_oak-base`) needs an
  explicit image→context mapping in the ported script rather than a single global context — cross-referenced
  here since a mismatch compounds the `image_version()` typo risk if image names and contexts drift out of
  sync.

### Performance & security

- **Docker Hub creds on every push, not just tag pushes — accepted, matches majora/docker.** `release-image`
  jobs still start on every branch/PR push (mirroring majora); only `skip_if_not_tag` gates the actual work,
  so `DOCKER_HUB_PASSWORD`/`DOCKER_HUB_USERNAME`/`DOCKER_ID_USER` are present as env vars on every run, on a
  full `machine: true` VM rather than a locked-down `docker:` executor. Same posture majora/docker already run
  in production with (no CircleCI Context scoping there either); oak is a private repo with no external-fork
  PRs, so this is an already-accepted risk, not something this issue changes.
- **`tonistiigi/binfmt` pinned by digest.** Majora/docker run it via a floating tag; oak hardens this by
  pinning the digest instead — closes a supply-chain gap (privileged container run from an unpinned
  third-party image) at negligible cost.
- **`docker login` stays where `push()` already has it — not moved earlier for `build()`.** Considered moving
  the login before `build()` too, to get authenticated Docker Hub pull-rate limits on the `FROM
  darthjee/scripts:...`/`darthjee/taa:...` pulls during real release builds. Declined: oak doesn't have
  private images or a demonstrated pull-rate problem to justify it, so `bin/image.sh` mirrors majora/docker's
  ordering exactly here.
- **Retention/rate-limit exposure — resolved out of scope.** Neither reference repo authenticates `FROM`
  base-image *pulls* either (only the `push()` side logs in), and every tag rebuild re-pushes every *changed*
  image for every enabled arch. Reconfirmed during refinement: matches majora/docker exactly, and oak has no
  demonstrated rate-limit problem today — revisit only if CI starts actually hitting Docker Hub's anonymous
  pull-rate limit.

### Testing strategy

- **Free validation before touching CircleCI**: `circleci config validate` locally on the new
  `.circleci/config.yml`, plus running `bin/image.sh build <image>` locally (build-only, no push) to confirm
  the ported script works with oak's `source`/`frontend` build contexts.
- **This issue's own PR is a live integration test**: `test`/`checks`/`jasmine`/`frontend-checks`/
  `upload_fe_files`/`release` already run on every branch push, and the new `release-image` jobs also start on
  branch pushes and immediately no-op via `skip_if_not_tag` — the PR's own CI run proves config parses,
  `requires:` wiring doesn't break existing jobs, and the guard exits cleanly without touching Docker Hub.
- **No disposable pre-release test tag.** Decided against exercising `push()` via a throwaway tag
  (e.g. `0.1.0-test1`) before trusting it for real. Instead, rely on oak's existing release-tag system as-is:
  since the `version` file seeds with versions that are already published and known-good, the first real tag
  build after merge is inherently safe. The actual `push()` codepath only fires for real the next time someone
  bumps a `dockerfiles/<image>/` change and its `version` line together on a real release tag — trusted
  directly at that point, no separate dry-run needed.
- **No post-build smoke test/pull-back verification** — out of scope. Neither majora's nor the `docker` repo's
  CI runs one today; adding one for oak now would be new scope beyond mirroring the reference implementations.
  Left as a possible future enhancement.
- **Implementation-process note (for whoever executes the plan)**: if CI fails while this mechanism is being
  rolled out/verified, stop and inform the developer rather than iterating autonomously — the developer will
  fix it manually before letting execution continue.

### Alternative solutions considered

1. **Port majora's/`docker`'s `bin/image.sh` mechanism as-is** — chosen for this issue. Consistency with the
   two sibling projects already running this in production outweighs marginal tooling improvements in any
   single repo; oak becomes the third consistent implementation rather than a one-off.
2. **CircleCI's official `circleci/docker` orb** instead of the hand-rolled script — deferred, out of scope
   for this issue. Spun off to **darthjee/oak#218** for a proper investigation (feature parity with
   `bin/image.sh`'s guards, migration cost) rather than deciding it mid-refinement here.
3. **`docker buildx build --platform ... --push`** (buildx bake) instead of QEMU + per-arch `docker build` —
   also deferred. Since majora and oak both inherit this pattern from the `docker` repo, the right place to
   modernize it is at the source: filed as **darthjee/docker#139**, with a standing briefing at
   `/Users/darthjee/projetos/mine/docker/issue.md` (includes the orb question from #218 too, so that repo's
   investigation can decide both together or explicitly punt). If/when that lands and rolls out through
   majora, oak can adopt it in a later revision of this same mechanism.
4. **Docker Hub Automated Builds** (Hub builds directly from the repo on push) — rejected outright, not
   pursued further. Doesn't fit oak's non-root build contexts (`source`/`frontend` subdirs), and Docker Hub
   has deprecated free-tier automated builds.

### Manual prerequisites (not deliverable by a PR alone)

- **CircleCI project environment variables**: `DOCKER_HUB_USERNAME`, `DOCKER_HUB_PASSWORD`, `DOCKER_ID_USER`
  must be added under oak's CircleCI project → Settings → Environment Variables. Neither `majora` nor the
  `docker` repo uses a shared CircleCI Context for these — both configure them per-project. Without this,
  `docker login` in `push()` fails as soon as a tag build reaches it.
- **Executor requirement**: the release job needs `machine: true` (real Docker daemon + `--privileged` for
  QEMU, for the two multi-arch images) — not a `docker:`-executor job. Confirm oak's CircleCI plan allows
  `--privileged` machine executors.
- **Non-shallow clone**: `skip_if_unchanged`'s `git tag --sort=-creatordate | awk 'NR==2{...}'` needs full tag
  history to sort correctly — confirm oak's CircleCI `checkout` step isn't doing a shallow/blobless clone.

### Explicitly out of scope

- **Upstream pin bumps.** This issue is about *oak publishing its own* base images from CI — it does **not**
  include bumping oak's `FROM darthjee/scripts:...`/`darthjee/taa:...` pins to newer upstream versions.
  Confirmed no auto-propagation exists anywhere in the `docker` → `majora`/`oak` chain (per the `docker`
  repo's answers, Q6); bumping an upstream pin remains a separate, manual `FROM`-line edit + commit regardless
  of what this issue does.

## Benefits

- Removes the fully manual `make build-base`/`make push-base` + local Docker Hub login step; CI publishes
  base images automatically on tagged releases.
- Fixes a live bug: `upload_fe_files`/`release` currently build the frontend inside an unrelated leftover
  image (`darthjee/vite_weave-base:0.0.4`) instead of oak's own `vite_oak-base`.
- Brings oak's dev-container base image (`oak-base`) and FE build base image (`vite_oak-base`) to native
  arm64, removing QEMU-emulation slowdown and native-extension bugs on the developer's Apple Silicon machine.
- Brings oak in line with `majora`'s and the `docker` repo's proven release mechanism, instead of being the
  odd one out with a manual-only process.

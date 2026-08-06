# Plan: Add docker image build to CI pipeline

Issue: [217-add-docker-image-build-to-ci-pipeline.md](../../issues/217-add-docker-image-build-to-ci-pipeline.md)

## Overview

Port majora's proven `bin/image.sh` + parameterized `release-image` CircleCI job mechanism into oak so
CircleCI builds and publishes all four base images (`oak-base`, `production_oak-base`, `circleci_oak-base`,
`vite_oak-base`) on tagged releases, replacing the fully manual `make build-base`/`make push-base` step. Along
the way, fixes `upload_fe_files`/`release` to build the frontend inside `vite_oak-base` instead of the
unrelated `vite_weave-base` image they're currently (incorrectly) pinned to. `oak-base`/`vite_oak-base` get
amd64+arm64; `circleci_oak-base`/`production_oak-base` stay amd64-only. This is a root-level/infra change —
no `source/` or `frontend/` application code is touched, so it doesn't fall under the backend or frontend
specialist agents.

## Context

Today, whoever needs a new base image version builds it locally via `make build-base`/`make push-base`
(requires local Docker Hub login) and manually updates every `FROM`/CI pin that references the old version.
`majora` (and the `docker` repo one level upstream) already automate this via a `bin/image.sh` script driven
by a parameterized `release-image` CircleCI job, gated by two guards (`skip_if_not_tag`,
`skip_if_unchanged`) so branch pushes and unchanged-image tag builds never touch Docker Hub. Full technical
grounding is in the issue file linked above (reference `bin/image.sh`, adaptations needed, scope table,
ordering, multi-arch split, edge cases, and rejected alternatives).

## Implementation Steps

### Step 1 — Bump CircleCI config to version 2.1

`.circleci/config.yml` is currently `version: 2`. Job `parameters:` (needed for the parameterized
`release-image` job below) is a CircleCI **2.1** feature — majora's reference config is already on `2.1` for
the same reason. Change the top-level `version: 2` to `version: 2.1`. (The `workflows: version: 2` key
underneath is unrelated and stays as-is — that's the workflows schema version, not the config version.)

### Step 2 — Create the `version` file

Add a `version` file at the repo root, seeded with the *current* live versions so the very first tag build
after merge is a safe no-op (nothing gets silently re-pushed — see the issue's "Backward compatibility"
section):

```
oak-base=0.1.0
production_oak-base=0.1.0
circleci_oak-base=0.0.4
vite_oak-base=0.0.1
```

### Step 3 — Port `bin/image.sh`

Create `bin/image.sh` (executable — `chmod +x`), based on majora's version but adapted for oak per the
issue's "Adaptations needed" and "Edge cases" sections:

- **Per-image build context.** oak's Dockerfiles don't all share one context the way majora's do (majora
  always builds with `.` as context). Add an `image_context()` helper: `frontend` for `vite_oak-base`,
  `source` for the other three. `build()` passes this instead of `.` to `docker build`.
- **`image_version()` fails loudly.** Unlike majora's version (which silently returns an empty string for a
  typo'd/missing image name), `exit 1` with a clear error message if the looked-up version is empty —
  prevents a malformed tag like `darthjee/oak-base:` (no version) from ever reaching `docker push`.
- **`tonistiigi/binfmt` pinned by digest** in `setup_qemu()`, instead of the floating `tonistiigi/binfmt`
  tag majora/docker use — resolve and hardcode the current `tonistiigi/binfmt` digest at implementation time
  (`docker pull tonistiigi/binfmt && docker inspect --format='{{index .RepoDigests 0}}' tonistiigi/binfmt`).

```bash
#!/bin/bash

PLATFORM=${PLATFORM:-linux/amd64}
BINFMT_IMAGE="tonistiigi/binfmt@sha256:<resolve-and-pin-at-implementation-time>"

function image_context() {
  case "$1" in
    vite_oak-base) echo "frontend" ;;
    *) echo "source" ;;
  esac
}

function image_version() {
  local image=$1
  local version
  version=$(cat version | grep "^${image}=" | sed -e "s/${image}=//g")
  if [ -z "$version" ]; then
    echo "No version found for image '${image}' in ./version" >&2
    exit 1
  fi
  echo "$version"
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

function setup_qemu() {
  local image=$1
  skip_if_not_tag
  skip_if_unchanged "$image"
  docker run --privileged --rm "$BINFMT_IMAGE" --install all
}

function build() {
  local image=$1 arch=$2
  local version; version=$(image_version "$image")
  local context; context=$(image_context "$image")
  local platform tag_suffix
  if [ -n "$arch" ]; then
    platform="linux/$arch"
    tag_suffix="-$arch"
  else
    platform="$PLATFORM"
    tag_suffix=""
  fi
  local latest_tag="$DOCKER_ID_USER/$image:latest${tag_suffix}"
  local cached_tag="$DOCKER_ID_USER/$image:cached${tag_suffix}"
  local version_tag="$DOCKER_ID_USER/$image:${version}${tag_suffix}"
  docker tag "$latest_tag" "$cached_tag" 2>/dev/null || true
  docker rmi "$latest_tag" 2>/dev/null || true
  docker build --platform "$platform" -f "dockerfiles/$image/Dockerfile" "$context" -t "$latest_tag"
  docker tag "$latest_tag" "$version_tag"
  if docker images | grep -q "$cached_tag"; then
    docker rmi "$cached_tag"
  fi
}

function push() {
  local image=$1 arch=$2
  local version tag_suffix
  version=$(image_version "$image")
  [ -n "$arch" ] && tag_suffix="-$arch" || tag_suffix=""

  skip_if_not_tag
  skip_if_unchanged "$image"

  echo "$DOCKER_HUB_PASSWORD" | docker login -u "$DOCKER_HUB_USERNAME" --password-stdin

  build "$image" "$arch"
  docker push "$DOCKER_ID_USER/$image:latest${tag_suffix}"
  docker push "$DOCKER_ID_USER/$image:${version}${tag_suffix}"
}

ACTION=$1
IMAGE_NAME=$2
ARCH=${3:-}

case $ACTION in
  "build") build "$IMAGE_NAME" "$ARCH" ;;
  "push")  push "$IMAGE_NAME" "$ARCH" ;;
  "qemu")  setup_qemu "$IMAGE_NAME" ;;
  *)
    echo "Usage: $0 <action> <image_name> [arch]"
    echo "Actions: build, push, qemu"
    exit 1
    ;;
esac
```

### Step 4 — Add the `release-image` job and its 6 instances to `.circleci/config.yml`

Add the parameterized job definition under `jobs:`:

```yaml
  release-image:
    parameters:
      image:
        type: string
      arch:
        type: string
        default: ""
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

Instantiate it 6 times in `workflows.test.jobs` — amd64+arm64 for `oak-base`/`vite_oak-base`, amd64-only for
`circleci_oak-base`/`production_oak-base` (per the issue's "Multi-arch" decision):

```yaml
      - release-image:
          name: release-oak-base
          image: oak-base
          filters: *semver_tags
      - release-image:
          name: release-oak-base-arm64
          image: oak-base
          arch: arm64
          filters: *semver_tags
      - release-image:
          name: release-circleci_oak-base
          image: circleci_oak-base
          filters: *semver_tags
      - release-image:
          name: release-production_oak-base
          image: production_oak-base
          filters: *semver_tags
      - release-image:
          name: release-vite_oak-base
          image: vite_oak-base
          filters: *semver_tags
      - release-image:
          name: release-vite_oak-base-arm64
          image: vite_oak-base
          arch: arm64
          filters: *semver_tags
```

`*semver_tags` is a new anchor (see Step 5) scoping the tag filter to oak's existing semver convention
(`\d+\.\d+\.\d+`, matching `build-and-release`/`upload_*`/`release`'s filter today) instead of majora's
permissive `/.*/` — per the issue's "Edge cases" decision. With no `branches:` key, these jobs still run (and
self-no-op via `skip_if_not_tag`) on every branch push, which is required for `requires:` to resolve below.

### Step 5 — Wire `requires:` and scope existing tag filters to semver

Per the issue's "Ordering" section, jobs that pull a base image by fixed tag must `requires:` that image's
`release-image` instance(s), purely for same-run publish-before-pull ordering:

- `test`, `checks` → add `requires: [release-circleci_oak-base]`
- `jasmine`, `frontend-checks` → add `requires: [release-vite_oak-base, release-vite_oak-base-arm64]`
  (mirrors majora wiring this on `jasmine`/`frontend-checks` even though they run in the unrelated
  `circleci_node` image — a grouping dependency, kept for consistency with the reference implementation)
- `upload_fe_files` → add `release-vite_oak-base`/`release-vite_oak-base-arm64` to its existing
  `requires: [test, checks, jasmine, frontend-checks]`
- `build-and-release` (triggers the external deploy that pulls `production_oak-base`) → add
  `release-production_oak-base` to its existing `requires:`
- `release` (final gate, mirrors majora's blanket final-gate pattern) → add all 6 `release-image` instance
  names to its existing `requires: [build-and-release, upload_proxy_files, upload_fe_files]`

**Implementation-level consequence, not previously called out in the issue:** `test`/`checks`/`jasmine`/
`frontend-checks` currently use a permissive `filters: tags: only: /.*/`. Once they `requires:` a
`release-image` instance scoped to `/\d+\.\d+\.\d+/`, a stray non-semver tag push would trigger the
downstream job per its own filter but never schedule the `release-image` job it `requires:` — CircleCI would
then simply never run the downstream job for that push (an unrelated, silent gap). Avoid this by introducing
a shared anchor and scoping `test`/`checks`/`jasmine`/`frontend-checks`/`coverage-final` to the same
`\d+\.\d+\.\d+` pattern as their new `release-image` dependencies:

```yaml
      - test:
          filters: &semver_tags
            tags:
              only: /\d+\.\d+\.\d+/
          requires: [release-circleci_oak-base]
      - checks:
          filters: *semver_tags
          requires: [release-circleci_oak-base]
      - jasmine:
          filters: *semver_tags
          requires: [release-vite_oak-base, release-vite_oak-base-arm64]
      - coverage-final:
          requires: [test, jasmine]
          filters: *semver_tags
      - frontend-checks:
          filters: *semver_tags
          requires: [release-vite_oak-base, release-vite_oak-base-arm64]
```

This narrows behavior only for hypothetical non-semver tags (oak's actual tag history is clean semver
already, per the issue's edge-case note) and has no effect on branch pushes (no `branches:` key means "run on
every branch" either way).

### Step 6 — Fix `upload_fe_files`/`release` to use `vite_oak-base`

Both jobs currently pin `darthjee/vite_weave-base:0.0.4` (an unrelated leftover image). Change both to
`darthjee/vite_oak-base:0.0.1` — the version seeded in Step 2, matching the `dockerfiles/vite_oak-base/`
Dockerfile's actual current content, and consistent with how `test`/`checks` already pin
`circleci_oak-base:0.0.4` by fixed tag.

### Step 7 — Local validation before pushing

- `circleci config validate` against the updated `.circleci/config.yml`.
- `bin/image.sh build oak-base` / `circleci_oak-base` / `production_oak-base` / `vite_oak-base` locally
  (build-only, no push — `DOCKER_HUB_*` env vars not needed for this) to confirm the ported script works with
  oak's `source`/`frontend` build contexts before trusting it in CI.

## Files to Change

- `.circleci/config.yml` — bump to `version: 2.1`; add `release-image` job + 6 instances; wire `requires:` on
  `test`/`checks`/`jasmine`/`frontend-checks`/`upload_fe_files`/`build-and-release`/`release`; scope
  `test`/`checks`/`jasmine`/`frontend-checks`/`coverage-final`'s tag filters to `\d+\.\d+\.\d+`; fix
  `upload_fe_files`/`release`'s docker image to `darthjee/vite_oak-base:0.0.1`.
- `bin/image.sh` (new, executable) — ported `image_version`/`skip_if_not_tag`/`skip_if_unchanged`/
  `setup_qemu`/`build`/`push`, adapted for oak's per-image build contexts, loud-fail version lookup, and
  digest-pinned `binfmt`.
- `version` (new) — seeds all four images at their current live versions.

## CI Checks

This issue's own PR is the primary test — see the issue's "Testing strategy" section (no disposable
pre-release tag; the `release-image` jobs start on the PR's own branch push and immediately no-op via
`skip_if_not_tag`, proving config parses and `requires:` wiring doesn't break `test`/`checks`/`jasmine`/
`frontend-checks`). Additionally, before pushing:

- `circleci config validate` (CircleCI config lint, no local job maps to this — install the `circleci` CLI if
  not already present)
- `bin/image.sh build <image>` for each of the four images, run locally (build-only, no push)

## Notes

- **Manual prerequisites, not deliverable by this PR** (see issue): `DOCKER_HUB_USERNAME`,
  `DOCKER_HUB_PASSWORD`, `DOCKER_ID_USER` must be added under oak's CircleCI project → Settings →
  Environment Variables; confirm the CircleCI plan allows `--privileged` `machine: true` executors; confirm
  the `checkout` step isn't doing a shallow/blobless clone (needed for `skip_if_unchanged`'s
  `git tag --sort=-creatordate`).
- **If CI fails while this mechanism is being rolled out/verified**, stop and inform the developer rather
  than iterating autonomously — per the issue's explicit instruction, the developer will fix it manually
  before implementation continues.
- Upstream pin bumps (`FROM darthjee/scripts:...`/`darthjee/taa:...`) and authenticating the `FROM` base-image
  *pulls* (as opposed to pushes) are both explicitly out of scope for this issue (see issue).
- The `circleci/docker` orb alternative (darthjee/oak#218) and modernizing to `docker buildx` at the source
  (darthjee/docker#139) are both tracked separately and don't block this plan.

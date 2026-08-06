# CI Working Directory Audit

## Why this exists

The `upload_proxy_files` CircleCI job broke on a tagged release (#221)
because its Docker image, `darthjee/tent:0.10.1`, started pre-populating
`/var/www/html` — the same path the job used as its `working_directory`.
`checkout` then failed, because the directory wasn't empty.

That coupling between a job's `working_directory` and content its own
Docker image bakes in isn't visible anywhere in `.circleci/config.yml` — it
only breaks once the image's contents change, and (for `upload_proxy_files`
specifically) only surfaces on a tagged release rather than during regular
CI runs, since that job is tag-only.

`scripts/audit_working_dirs.sh` re-runs that check on demand, so the next
time this happens it's caught before a release rather than during one.

## What it checks

For every job in `.circleci/config.yml` that uses the `docker:` executor
**and** declares an explicit `working_directory`, the script runs
`docker run --rm <image> sh -c "ls -A '<working_directory>'"` and reports
whether the directory already contains files.

Only jobs with an **explicit** `working_directory` are checked. Jobs that
rely on CircleCI's implicit default (`~/project`) are out of scope — none
of the images built from `dockerfiles/` in this repo bake content into
that path today, so there is nothing to collide with. If that ever
changes, extend the script's scope accordingly.

## When to run it

Run `scripts/audit_working_dirs.sh` (requires local Docker) manually
whenever:

- A custom image tag referenced in `.circleci/config.yml` is bumped (i.e.
  the `version` file changes), or
- Any `dockerfiles/*/Dockerfile` changes.

This is a manual/periodic step, not a CI job — automating it fully would
require `docker run` against third-party images that aren't part of this
repo's own image release pipeline (e.g. `darthjee/tent`,
`darthjee/navi-hey`), which isn't practical to run on every CI build.

## Baseline (2026-08-06)

Only one job currently sets an explicit `working_directory`:

| Job | Image | `working_directory` | Result |
|-----|-------|----------------------|--------|
| `upload_proxy_files` | `darthjee/tent:0.10.1` | `/home/app/app` | OK — empty, no collision (fixed in #221) |

Every other `docker`-executor job (`test`, `checks`, `coverage-final`,
`jasmine`, `frontend-checks`, `upload_fe_files`, `release`) relies on
CircleCI's implicit default `working_directory` and is out of scope per
the note above. `release-image`, `build-and-release`, and `warm-up-cache`
use the `machine` executor (or, for `warm-up-cache`, an image with no
declared `working_directory`) and are excluded by construction — the
script only reads jobs with a `docker:` key and an explicit
`working_directory`.

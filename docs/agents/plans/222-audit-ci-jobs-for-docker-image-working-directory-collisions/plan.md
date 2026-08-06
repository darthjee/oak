# Plan: Audit CI jobs for docker image working_directory collisions

Issue: [222-audit-ci-jobs-for-docker-image-working-directory-collisions.md](../../issues/222-audit-ci-jobs-for-docker-image-working-directory-collisions.md)

## Overview

Add a repeatable script that inspects every `docker`-executor job in
`.circleci/config.yml`, and for any job that sets an explicit
`working_directory`, checks whether the job's Docker image already bakes
content into that path (the root cause behind the `upload_proxy_files`
break fixed in #221). Document when to run it and record the current
audit result as a baseline. This is purely infra/docs work — it does not
touch `source/` or `frontend/`, so it stays with the architect (no
backend/frontend split).

## Context

`upload_proxy_files` broke on a tagged release because `darthjee/tent:0.10.1`
started pre-populating `/var/www/html`, which the job also used as its
`working_directory` — `checkout` then failed because the directory wasn't
empty. That coupling between a job's `working_directory` and its image's
baked-in content isn't visible anywhere in `.circleci/config.yml`; it only
surfaces once the image changes, and only on the rare `upload_proxy_files`
run (tag-only). #221 fixed that one job and manually audited the rest of
the file, finding no other collisions. This issue turns that one-off manual
audit into a repeatable, documented check.

## Implementation Steps

### Step 1 — Write the audit script

Add `scripts/audit_working_dirs.sh`:
- Parse `.circleci/config.yml` (Ruby's built-in `YAML` — Ruby is already a
  first-class dependency of this repo, keeping the parsing robust without
  adding a new tool) to list every job using the `docker:` executor **and**
  declaring an explicit `working_directory` (jobs relying on CircleCI's
  default `~/project` are out of scope for the coupling described in the
  issue — none of the images built from `dockerfiles/` bake content there).
- For each such job, `docker run --rm <image> sh -c "ls -A '<working_directory>'"`
  and report whether the directory is empty (OK) or already contains files
  (COLLISION), printing per-job results.
- Exit non-zero if any collision is found, so the script can double as a
  manual gate whenever a custom image tag or a `dockerfiles/*/Dockerfile`
  changes.
- Follow the existing `bash` convention used by other `scripts/*.sh` files
  in this repo (see `scripts/bump_version.sh`, `scripts/warm_up_cache.sh`);
  make the file executable.

### Step 2 — Document the runbook and baseline

Add `docs/agents/ci-working-directory-audit.md`:
- Explain what the script checks and why (link back to the #221 root
  cause).
- State when to run it: whenever a custom image tag referenced in
  `.circleci/config.yml` is bumped (the `version` file changes) or a
  `dockerfiles/*/Dockerfile` changes — this is a manual step for now, not
  an added CI job, since it needs `docker run` against arbitrary
  third-party images (`tent`, `navi-hey`) that aren't built from this
  repo's own Dockerfiles.
- Record the current baseline: as of this issue, only `upload_proxy_files`
  (image `darthjee/tent:0.10.1`, `working_directory: /home/app/app`) sets
  an explicit `working_directory`, and it no longer collides (fixed in
  #221). No other job in `.circleci/config.yml` sets an explicit
  `working_directory`.

### Step 3 — Cross-link from Contributing

In `docs/agents/contributing.md`, under the existing `### CI Checks`
section, add one short line pointing at the new script/doc so it's
discoverable from the place contributors already look for CI guidance.

## Files to Change

- `scripts/audit_working_dirs.sh` — new script; audits docker-executor jobs
  with an explicit `working_directory` for collisions with their image's
  baked-in content.
- `docs/agents/ci-working-directory-audit.md` — new doc; runbook + trigger
  condition + baseline audit result.
- `docs/agents/contributing.md` — add a pointer to the new runbook under
  `### CI Checks`.

## CI Checks

No RSpec/RuboCop/Jasmine/ESLint job covers `scripts/` or `.circleci/config.yml`
directly. Validate manually:
- `bash -n scripts/audit_working_dirs.sh` (syntax check)
- `scripts/audit_working_dirs.sh` run locally against `.circleci/config.yml`
  (requires local `docker`) to confirm it reports the `upload_proxy_files`
  baseline correctly and exits 0 (no collisions).

## Notes

- The script only covers jobs with an **explicit** `working_directory`,
  matching the exact coupling described in the issue and confirmed by the
  #221 root cause. Jobs using CircleCI's implicit default (`~/project`)
  are out of scope; note this explicitly in the runbook doc so a future
  reader understands why they aren't checked.
- `release-image` and `build-and-release` use the `machine` executor (no
  Docker image `working_directory` semantics) and are excluded by
  construction — the script only reads jobs with a `docker:` key.
- The script assumes local Docker access; it isn't wired into CI itself
  (documented as a manual/periodic step per the issue's acceptance
  criteria, since running it automatically would need `docker run` for
  third-party images that aren't part of this repo's own image release
  pipeline).

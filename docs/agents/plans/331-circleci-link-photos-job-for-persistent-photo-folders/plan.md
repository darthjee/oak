# Plan: CircleCI link_photos job for persistent photo folders

Issue: [331-circleci-link-photos-job-for-persistent-photo-folders.md](../../issues/331-circleci-link-photos-job-for-persistent-photo-folders.md)

## Overview

Copy Majora's committed `bin/deploy_frontend.sh` into Oak and switch every
deploy job to it. Then add a tag-only `link_photos` job that symlinks
`$REMOTE_HOME/photos/photos` and `$REMOTE_HOME/photos/snaps` into the release
with the script's re-run-safe `ln -sfn`, and make `release` require it.
Update the photo deployment guide and the infrastructure doc to match.

## Context

`deploy_frontend.sh release` swaps the temp release dir into
`$SSH_REMOTE_DIR`, so anything stored inside a release is lost on the next
deploy. Photos live in `$REMOTE_HOME/photos/{origin,photos,snaps}`, created
once by hand, and each release needs `photos` and `snaps` symlinks into it.

The Tent image's `deploy_frontend.sh link` runs plain `ln -s`, which nests a
link inside the storage when it runs again. Majora's `bin/deploy_frontend.sh`
(`/Users/darthjee/projetos/mine/majora/bin/deploy_frontend.sh`) runs
`ln -sfn`. It also uses a per-workflow temp dir
(`${SSH_REMOTE_TEMP_DIR%/}-$CIRCLE_WORKFLOW_WORKSPACE_ID`) and gives subpaths
with `DEPLOY_PATH`. The temp dir must be the same in every job, so all deploy
jobs move to the copied script together.

The whole change is root-level (`.circleci/`, `bin/`, `docs/`), so the
architect owns it and there is no specialist split.

## Steps

- [01 — Copy Majora's deploy script](plan/01-copy-deploy-script.md)
- [02 — Switch existing deploy jobs to bin/deploy_frontend.sh](plan/02-switch-deploy-jobs.md)
- [03 — Add the link_photos job and wire it into release](plan/03-add-link-photos-job.md)
- [04 — Update deployment and infrastructure docs](plan/04-update-docs.md)

## CI Checks

- `.circleci/config.yml`: `circleci config validate` (if the CLI is
  available). No CI job lints the config.
- `bin/deploy_frontend.sh`: `bash -n bin/deploy_frontend.sh` and, if
  available, `shellcheck bin/deploy_frontend.sh`.
- The deploy jobs run only on semver tags, so the real check is the first
  tagged release (see Notes).

## Notes

- **Before the first tag:** set `REMOTE_HOME` in the CircleCI project env as
  a literal absolute path (it is expanded on the CI side, so not `~`). Also
  run `mkdir -p $REMOTE_HOME/photos/{origin,photos,snaps}` on the server.
  Without these, `ln -sfn` still succeeds but creates dangling links.
- **Leftover temp dirs:** with the per-workflow suffix, a workflow that fails
  before `release` leaves `${SSH_REMOTE_TEMP_DIR}-<id>` on the server. The
  same happens in Majora. The next workflow does not reuse it, so it only
  needs occasional manual cleanup.
- **Re-runs:** CircleCI keeps `CIRCLE_WORKFLOW_WORKSPACE_ID` across re-runs
  of the same workflow, so a re-run reuses the same temp dir. `ln -sfn`
  replaces the existing links, and the rsync uploads are idempotent.
- **Symlinks in prod:** check that Tent's static handler follows symlinks
  (tracked by #332's checklist; out of scope here).
- **`release` cleanup:** the old release is removed with `rm -rf`, which
  deletes the symlinks without following them, so the persistent photos are
  safe.

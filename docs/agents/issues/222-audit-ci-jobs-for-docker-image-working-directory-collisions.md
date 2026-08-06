# Audit CI jobs for docker image working_directory collisions

## Context

While fixing #221 (the `upload_proxy_files` CircleCI job failing on `checkout` because the `darthjee/tent:0.10.1` image now pre-populates `/var/www/html`, which the job used as its `working_directory`), we found the root cause was a silent coupling: a job's `working_directory` pointed at a path that a custom Docker image bakes content into. That coupling isn't visible anywhere in `.circleci/config.yml` — it only breaks once the underlying image's contents change, and it then surfaces as a broken deploy on a tagged release rather than during regular CI runs, since `upload_proxy_files` only runs on version tags.

As part of #221 we manually audited every job in `.circleci/config.yml` and confirmed no other job currently has this problem, but there's no repeatable process to catch it early the next time a custom image (`oak-base`, `circleci_oak-base`, `production_oak-base`, `vite_oak-base`, `tent`, `navi-hey`, etc.) is bumped.

## What needs to be done

- Define a repeatable way (script or documented runbook) to check, for each job in `.circleci/config.yml`, whether its `working_directory` collides with content the job's Docker image already bakes in (e.g. `docker run --rm <image> ls -la <working_directory>` and check for pre-existing files before `checkout` would run there).
- Decide when this check should run: as a manual step whenever a custom image tag referenced in `.circleci/config.yml` is bumped, and/or as a periodic scheduled check.
- Record the outcome of the current audit (done during #221) as a baseline for future diffs.

## Acceptance criteria

- [ ] A script or documented procedure exists to check job `working_directory` values against their image's pre-populated content
- [ ] The procedure is triggered (manually or as a reminder) whenever a custom image tag referenced in `.circleci/config.yml` is bumped
- [ ] Current audit results (no collisions besides the one fixed in #221) are recorded as a baseline

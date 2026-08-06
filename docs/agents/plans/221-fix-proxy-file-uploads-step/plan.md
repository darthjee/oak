# Plan: Fix proxy file uploads step

Issue: [221-fix-proxy-file-uploads-step.md](../../issues/221-fix-proxy-file-uploads-step.md)

## Overview

The `upload_proxy_files` CircleCI job fails on `checkout` because its `working_directory: /var/www/html` collides with content the `darthjee/tent:0.10.1` image now pre-populates at that path. Fix it by changing the job's `working_directory` to `/home/app/app`, matching the pattern already proven in production by the `majora` project's equivalent job. `SOURCE=/var/www/html/` in the "Upload proxy files" step stays unchanged, since it refers to the tent image's built-in web root, not the checkout location.

## Context

This regression was introduced by the immediately preceding commit (`83d6522`) fixing a typo (`workdir` → `working_directory`), which made the previously-inert `working_directory: /var/www/html` setting take effect. None of the job's steps (`generate_key_file`, `upload`, `copy_files` — implemented by the tent image's `deploy_frontend.sh`) read local checked-out files; they operate purely via SSH/rsync against env vars (`SOURCE`, `TARGET`, `SSH_REMOTE_DIR`, etc.). This was confirmed directly by inspecting the image with Docker: `/var/www/html` is pre-populated (`.htaccess`, `configuration/`, `extension/`, `index.php`, `lib/`, `loader.php`) while `/home/app/app` does not exist, so it is safe for `checkout` to land there. Scope is confirmed limited to this one job — no other job in `.circleci/config.yml` overrides `working_directory` to a path a custom image bakes content into.

## Implementation Steps

### Step 1 — Change the job's working directory

In `.circleci/config.yml`, under the `upload_proxy_files` job, change:

```yaml
working_directory: /var/www/html
```

to:

```yaml
working_directory: /home/app/app
```

Leave every step under `upload_proxy_files` unchanged, including `SOURCE=/var/www/html/ deploy_frontend.sh upload` and `TARGET=configuration/ deploy_frontend.sh copy_files` — both operate on remote/absolute paths unrelated to the local working directory.

### Step 2 — Validate the config

Run `circleci config validate` (or the equivalent local command) against `.circleci/config.yml` to confirm the YAML is still well-formed after the change. This cannot exercise the actual `checkout`/SSH behavior locally (the job needs production secrets and only runs on version-tag pushes), so real validation happens on the next tagged release — see the issue's "Solution" section for the reasoning behind treating that as acceptable.

## Files to Change

- `.circleci/config.yml` — change `working_directory` for the `upload_proxy_files` job from `/var/www/html` to `/home/app/app`.

## CI Checks

- `.` (repo root): `circleci config validate` (no dedicated CircleCI job runs this; it is a local sanity check for config changes)

## Notes

- No behavioral change to what gets deployed — verified via `deploy_frontend.sh` inside the `darthjee/tent:0.10.1` image that none of this job's commands depend on the local working directory.
- A separate follow-up issue (#222) tracks building a repeatable way to catch this class of `working_directory`/image-content collision earlier in the future; out of scope for this fix.
- Real end-to-end confirmation only happens on the next version-tag push, since `upload_proxy_files` is gated by `tags: only: /\d+\.\d+\.\d+/` / `branches: ignore: /.*/` and needs production SSH secrets not available locally.

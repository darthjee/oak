# Issue: Fix proxy file uploads step

## Description

The `upload_proxy_files` CircleCI job, which deploys proxy files to production on tagged releases, started failing after an update to the `darthjee/tent` Docker image. The job's `checkout` step now fails because its `working_directory` collides with content the image bakes in.

## Problem

In `.circleci/config.yml`, the `upload_proxy_files` job sets `working_directory: /var/www/html` and then runs `checkout` there. The `darthjee/tent:0.10.1` image pre-populates `/var/www/html` with the proxy app's own files (`.htaccess`, `configuration/`, `extension/`, `index.php`, `lib/`, `loader.php`), so CircleCI's checkout step fails with "Directory (/var/www/html) you are trying to checkout to is not empty and not a git repository".

This regression was introduced by the immediately preceding commit (`83d6522`, "Fix #217 — Add docker image build to CI pipeline"), which corrected a typo from the bogus key `workdir: /var/www/html` (silently ignored by CircleCI) to the real key `working_directory`. Before that fix, checkout used the default `~/project` directory instead, so the collision was latent rather than active.

Confirmed by inspecting every job in `.circleci/config.yml`: `upload_proxy_files` is the only job using a `tent`-family image, and the only one overriding `working_directory` to a path a custom image pre-populates. All other jobs either use the default `~/project` working directory (not pre-populated by any of the custom images) or a `machine` executor, so no other job is affected. A follow-up issue (#222) tracks building a repeatable way to catch this class of problem earlier in the future.

## Expected Behavior

The `upload_proxy_files` job should check out successfully and complete the proxy file upload on every tagged release, without colliding with the `tent` image's built-in content.

## Solution

Mirror the fix already applied and proven in production in the `majora` project's `.circleci/config.yml` for the equivalent job: change `working_directory` for `upload_proxy_files` away from `/var/www/html` to `/home/app/app`, so `checkout` no longer collides with the tent image's pre-populated web root, while keeping `SOURCE=/var/www/html/` for the "Upload proxy files" step so it still uploads the tent image's built-in content unchanged.

This is safe: none of this job's steps (`generate_key_file`, `upload`, `copy_files`, all implemented by the tent image's `deploy_frontend.sh`) read local checked-out files — they are pure SSH/rsync operations driven by env vars (`SOURCE`, `TARGET`, `SSH_REMOTE_DIR`, etc.) against the remote host. Verified directly by inspecting `deploy_frontend.sh` inside the `darthjee/tent:0.10.1` image via Docker, and by confirming `/home/app/app` does not exist in the image (so `checkout` has nowhere to collide). So the checked-out repo content at the job's working directory has never actually mattered to this job's behavior — changing it does not alter any deployed file or remote path, meaning this change carries no backward-compatibility risk.

Given `upload_proxy_files` only runs on version-tag pushes (gated by `tags: only: /\d+\.\d+\.\d+/`, `branches: ignore: /.*/`) and needs production SSH secrets unavailable locally, a full CI dry run is not possible before merge; the next tagged release is the real acceptance test, backed by the local Docker verification above and by majora's already-proven identical pattern.

## Benefits

- Restores the ability to deploy proxy files on version-tag releases, unblocking the production deployment pipeline.
- Reuses a pattern already validated in production by `majora`, minimizing risk.
- Contained to a single job — no other job needs to change.

# Issue: CircleCI link_photos job for persistent photo folders

## Description
Add a tag-only CircleCI job, `link_photos`, that symlinks the persistent photo folders on the Dreamhost host into each new proxy release before `release` swaps it in. The job needs a deploy script whose `link` is safe to re-run. To get one, Oak adopts Majora's committed `bin/deploy_frontend.sh`, and every deploy job switches to it. Part of the photo production rollout (parent #328); the guide is `docs/agents/specs/photo/deployment.md`.

## Problem
`deploy_frontend.sh release` replaces the whole site directory: it moves the live dir aside, moves the temp release dir into its place and deletes the old one. Any photo stored inside the release is lost on the next deploy. The static rule serves `/photos/<file_path>` from `$staticRoot/photos/<file_path>`, so the release must contain `photos` and `snaps` entries that resolve to storage outside it.

The Tent image's `deploy_frontend.sh link` runs a plain `ln -s $SOURCE $TARGET`, which is not safe to re-run. If `TARGET` is already a symlink to a directory, `ln -s` follows it and creates a nested link inside the persistent storage, for example `$REMOTE_HOME/photos/photos/photos`.

## Expected Behavior
- Persistent storage lives in `$REMOTE_HOME/photos/{origin,photos,snaps}` on the server, outside any release. Creating it stays a manual one-time setup step, not part of the job.
- Every tagged release contains `photos -> $REMOTE_HOME/photos/photos` and `snaps -> $REMOTE_HOME/photos/snaps`. `origin/` is not linked, because originals are never served.
- Files uploaded before a deploy are still served after it.
- Re-running `link_photos` or the whole workflow replaces the links rather than nesting them.
- `release` cannot run until `link_photos` has finished.

## Solution
### Adopt Majora's deploy script
- Copy `bin/deploy_frontend.sh` from Majora (`darthjee/majora`) into Oak as-is. Compared with the image script:
  - the temp release dir is `${SSH_REMOTE_TEMP_DIR%/}-$CIRCLE_WORKFLOW_WORKSPACE_ID` (`workspace_temp_dir`);
  - subpaths inside it are given with `DEPLOY_PATH` (`remote_temp_dir`) instead of overriding `SSH_REMOTE_TEMP_DIR`;
  - `link` runs `ln -sfn $SOURCE $(remote_temp_dir)`, which replaces an existing link instead of following it;
  - `release` swaps `workspace_temp_dir` into `$SSH_REMOTE_DIR`.
- All deploy jobs move to `bin/deploy_frontend.sh`, since they must agree on the temp dir:
  - `upload_fe_files`: `build`, `generate_key_file`, `DEPLOY_PATH=static/ generate_folder`, `SOURCE=dist/ DEPLOY_PATH=static/ upload`.
  - `upload_proxy_files`: `SOURCE=/var/www/html/ upload`; `SOURCE=proxy/prod_configuration/ DEPLOY_PATH=configuration/ upload`; `TARGET=configuration/locals.php DEPLOY_PATH=configuration copy_files`; `SOURCE=proxy/extension/ DEPLOY_PATH=extension/ upload`.
  - `release`: `generate_key_file`, `release`.
- Each of these jobs already has `checkout`, and `upload_fe_files`'s folder shuffle keeps `bin/` at the root, so the relative `bin/deploy_frontend.sh` path works.

### `link_photos` job
- New tag-only job on `darthjee/tent:0.10.4` with `working_directory: /home/app/app`:
  1. `checkout`
  2. `bin/deploy_frontend.sh generate_key_file`
  3. `bin/deploy_frontend.sh generate_folder` (`mkdir -p` on the temp release dir, so the job depends on no other deploy job)
  4. `SOURCE=$REMOTE_HOME/photos/photos DEPLOY_PATH=photos bin/deploy_frontend.sh link`
  5. `SOURCE=$REMOTE_HOME/photos/snaps DEPLOY_PATH=snaps bin/deploy_frontend.sh link`
- Workflow: `link_photos` requires the same test jobs as `upload_proxy_files` (`test`, `checks`, `jasmine`, `frontend-checks`) and uses the same tag-only filters. It runs in parallel with the upload jobs. `release` adds `link_photos` to its `requires`.

### Notes
- `SOURCE` is expanded on the CircleCI side before the SSH call, so `REMOTE_HOME` must be a literal absolute path, not `~`.
- Neither the Tent image's `/var/www/html` nor the frontend upload (`static/`) contains `photos` or `snaps`. `ln -sfn` therefore always creates or replaces a top-level link, never one inside a real directory.
- `release` runs `rm -rf` on the old release. That removes the symlinks without following them, so persistent files are safe.

### Docs
- Document `REMOTE_HOME` as a CircleCI project env var.
- In `docs/agents/specs/photo/deployment.md` and `examples.md`, move `link_photos` from proposal to current state, and describe `bin/deploy_frontend.sh`, the per-workflow temp dir and `DEPLOY_PATH`.
- Update the deploy description in `docs/agents/architecture/infrastructure.md` where it names the image script or `SSH_REMOTE_TEMP_DIR` overrides.

### Acceptance criteria
- [ ] After a deploy, the live release has `photos` and `snaps` symlinks pointing at `$REMOTE_HOME/photos/...`.
- [ ] Files uploaded before a deploy are still there after it.
- [ ] `release` waits for `link_photos`; `link_photos` does not wait for the upload jobs.
- [ ] Every deploy job calls `bin/deploy_frontend.sh`, not the image script.
- [ ] Re-running `link_photos` leaves no nested link inside `$REMOTE_HOME/photos`.

## Benefits
Uploaded photos survive every deploy, and re-runs can't corrupt photo storage. Oak and Majora share one deploy script and job shape, so deploy fixes carry over between them.

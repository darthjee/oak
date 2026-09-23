# Switch existing deploy jobs to bin/deploy_frontend.sh

Change every deploy step in `.circleci/config.yml` from the image's
`deploy_frontend.sh` to `bin/deploy_frontend.sh`. Replace the
`SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/<x>` overrides with
`DEPLOY_PATH=<x>`. All jobs must use the same `workspace_temp_dir`, or the
release swap misses the uploaded files.

- `upload_fe_files` (`vite_oak-base`): the "Set folder" step removes
  `source/` and flattens `frontend/`, but `bin/` stays at the root.
  - `bin/deploy_frontend.sh build`
  - `bin/deploy_frontend.sh generate_key_file`
  - `DEPLOY_PATH=static/ bin/deploy_frontend.sh generate_folder`
  - `SOURCE=dist/ DEPLOY_PATH=static/ bin/deploy_frontend.sh upload`
- `upload_proxy_files` (`tent:0.10.4`, `working_directory: /home/app/app`):
  - `bin/deploy_frontend.sh generate_key_file`
  - `SOURCE=/var/www/html/ bin/deploy_frontend.sh upload`
  - `SOURCE=proxy/prod_configuration/ DEPLOY_PATH=configuration/ bin/deploy_frontend.sh upload`
  - `TARGET=configuration/locals.php DEPLOY_PATH=configuration bin/deploy_frontend.sh copy_files`
  - `SOURCE=proxy/extension/ DEPLOY_PATH=extension/ bin/deploy_frontend.sh upload`
- `release` (`vite_oak-base`):
  - `bin/deploy_frontend.sh generate_key_file`
  - `bin/deploy_frontend.sh release`

Keep the order of the `upload_proxy_files` steps. The extension upload must
still come after the Tent upload, which ships an empty
`extension/loader.php`.

`upload_proxy_files` runs `upload` with no `DEPLOY_PATH`, and rsync creates
the last path component, so `${SSH_REMOTE_TEMP_DIR}-<id>` is created there.
Its parent is the same as today's temp dir, so no extra `generate_folder` is
needed.

## Files to Change
- `.circleci/config.yml` — `upload_fe_files`, `upload_proxy_files` and
  `release` call `bin/deploy_frontend.sh` with `DEPLOY_PATH`

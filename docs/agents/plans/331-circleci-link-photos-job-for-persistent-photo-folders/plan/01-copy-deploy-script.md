# Copy Majora's deploy script

Copy `/Users/darthjee/projetos/mine/majora/bin/deploy_frontend.sh` into Oak
as `bin/deploy_frontend.sh`, unchanged, and make it executable
(`chmod +x`, committed as mode 100755). Keep its actions (`build`,
`generate_key_file`, `generate_folder`, `copy_files`, `upload`, `link`,
`release`) and its helpers:

- `workspace_temp_dir` → `${SSH_REMOTE_TEMP_DIR%/}-$CIRCLE_WORKFLOW_WORKSPACE_ID`
- `remote_temp_dir` → `workspace_temp_dir`, plus `/$DEPLOY_PATH` when set
- `link` → `ln -sfn $SOURCE $(remote_temp_dir)`
- `release` → swaps `workspace_temp_dir` into `$SSH_REMOTE_DIR`

Oak and Majora then share one script, so later deploy fixes can be copied
between the repos verbatim.

## Files to Change
- `bin/deploy_frontend.sh` — new; a verbatim copy of Majora's script

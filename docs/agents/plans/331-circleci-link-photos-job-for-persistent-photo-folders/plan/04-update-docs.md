# Update deployment and infrastructure docs

Describe what is now in place.

- `docs/agents/specs/photo/deployment.md`:
  - Intro: `link_photos` (#331) is done, no longer a proposal.
  - "Current state": the jobs call `bin/deploy_frontend.sh` (copied from
    Majora). Explain the per-workflow temp dir
    `${SSH_REMOTE_TEMP_DIR}-$CIRCLE_WORKFLOW_WORKSPACE_ID` and `DEPLOY_PATH`,
    and update the step commands.
  - "`link_photos`": the steps from step 03, `ln -sfn` and why it is safe to
    re-run, `generate_folder` so the job runs in parallel, and `release`
    requiring it. Remove the "differs from Majora / check the image script"
    caveat.
  - Env table: keep `REMOTE_HOME` (literal absolute path, expanded on CI).
    Note that `CIRCLE_WORKFLOW_WORKSPACE_ID` is built into CircleCI.
  - On-disk layout: the temp dir name gets the workflow suffix before the
    swap. The live layout is unchanged.
  - Drop the closing "check how `upload` and `copy_files` build the remote
    path" caveat, since the script is now in the repo.
- `docs/agents/specs/photo/examples.md`: replace the `link_photos` job and
  workflow snippets with the real ones from step 03.
- `docs/agents/specs/photo/index.md`: mark the #331 row as done if the table
  tracks status.
- `docs/agents/architecture/infrastructure.md`, **Deploy** bullet: mention
  `bin/deploy_frontend.sh` and the `link_photos` job, which links
  `$storageRoot/photos` and `$storageRoot/snaps` into each release as
  `photos`/`snaps`. Add `REMOTE_HOME` to the one-time bootstrap notes.

## Files to Change
- `docs/agents/specs/photo/deployment.md` — current-state rewrite for the
  deploy script and `link_photos`
- `docs/agents/specs/photo/examples.md` — real job and workflow snippets
- `docs/agents/specs/photo/index.md` — #331 status, if tracked
- `docs/agents/architecture/infrastructure.md` — deploy script, `link_photos`
  and `REMOTE_HOME`

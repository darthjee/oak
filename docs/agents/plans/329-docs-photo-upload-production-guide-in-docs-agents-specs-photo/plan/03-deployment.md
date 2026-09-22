# Deployment and photo folder linking

Create `docs/agents/specs/photo/deployment.md`, the target CircleCI changes for #330 and #331:

- Why: `release` replaces the whole site directory, so anything inside it is lost on the next deploy.
- `upload_proxy_files`: also upload the prod proxy config and `proxy/extension/` into the release temp dir, and keep copying the server-only `locals.php` forward from the live release (today it copies the whole `configuration/`).
- New `link_photos` job (tag-only, Tent image): `generate_key_file`, then
  `SOURCE=$REMOTE_HOME/photos/photos TARGET=$SSH_REMOTE_TEMP_DIR/photos deploy_frontend.sh link`
  and the same for `snaps`. Oak's `link` is `ln -s $SOURCE $TARGET`, unlike Majora's `DEPLOY_PATH` variant.
- `release` requires `link_photos`.
- The CircleCI env vars involved (`REMOTE_HOME`, `SSH_*`) and a one-time server setup (`mkdir -p $REMOTE_HOME/photos/{origin,photos,snaps}`).
- An on-disk layout diagram of the live release, showing the `photos`/`snaps` symlinks, `configuration/` and `extension/`.

## Files to Change
- `docs/agents/specs/photo/deployment.md`: new.

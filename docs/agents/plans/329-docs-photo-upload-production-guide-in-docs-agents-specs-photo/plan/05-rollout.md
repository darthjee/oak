# Rollout

Create `docs/agents/specs/photo/rollout.md`, the order to ship things in and the migration:

1. #330 + #331 together, before real prod uploads, so uploads land in `$REMOTE_HOME/photos`.
2. #332 static rules, and #333 settings/dev mounts.
3. #334 Tent 1.0.0, then #335 resizing.
4. #251 file migration: copy `photos.oak.ffavs.net` `photos/`, `snaps/` and the originals into `$REMOTE_HOME/photos/{photos,snaps,origin}`, keeping the `users/<uid>/items/<id>/<file>` layout.
5. #336: switch `OAK_PHOTOS_SERVER_URL` (Render env) to the Oak domain, check existing photos, retire `photos.oak.ffavs.net` and `prod_public_files/convert.sh`, and update navi warm-up config if it references the old host.
6. #337: move lasting content into `docs/agents/photo_upload/` and delete `docs/agents/specs/photo/`.

Include a short checklist to verify the result in prod (upload returns 200, `/photos` and `/snaps` return 200 with `Cache-Control`, photos survive a redeploy, delete removes all three files).

## Files to Change
- `docs/agents/specs/photo/rollout.md`: new.

# Rollout

The order in which the production photo work ships, the migration of the
existing files, and the checks that confirm it works in prod (#328). See the
[guide index](index.md) for the sub-issue map.

## Ship order

1. **#330 + #331 together**, before any real prod upload. The prod config
   gets the submit and delete rules, and CircleCI deploys the config, the
   extension and the `photos`/`snaps` links. Shipping one without the other
   either 404s or writes uploads inside the release, where the next deploy
   deletes them. Do the one-time server setup from
   [Deployment](deployment.md#environment-and-one-time-setup) first.
2. **#332** static `/photos` and `/snaps` rules, and **#333** settings, dev
   mounts and checks. Independent of each other.
3. **#334** Tent 1.0.0 (after darthjee/tent#287 is released), then **#335**
   resizing and delete of all three files.
4. **#251** file migration (below).
5. **#336** URL switch (below).
6. **#337** moves the lasting content into
   [`photo_upload/`](../../photo_upload/index.md) and deletes
   `docs/agents/specs/photo/`.

Until step 5, the app still reads photos from `photos.oak.ffavs.net`. New
uploads made between steps 1 and 5 exist only under `$REMOTE_HOME/photos`,
so they show as broken images until the switch. Keep this window short, or
avoid real uploads during it.

## #251: file migration

Copy the existing files into the new storage root, keeping the
`users/<uid>/items/<id>/<file>` layout:

| From | To |
| --- | --- |
| `photos.oak.ffavs.net/photos/` | `$REMOTE_HOME/photos/photos/` |
| `photos.oak.ffavs.net/snaps/` | `$REMOTE_HOME/photos/snaps/` |
| local `prod_public_files/origin/` (originals) | `$REMOTE_HOME/photos/origin/` |

- Use `rsync -a` (no `--delete`), so uploads already made in the new root
  are kept.
- Compare file counts per folder after the copy.
- The copy runs on the Dreamhost host (or from the machine holding the
  originals); it needs no code change.

## #336: URL switch

1. Set `OAK_PHOTOS_SERVER_URL` in the Render env to the Oak domain (the
   proxy host), and redeploy the backend.
2. Check that existing photos and snaps load from the new URLs.
3. Update the navi warm-up config (`navi/`) if it references
   `photos.oak.ffavs.net`.
4. Retire `photos.oak.ffavs.net` and remove `prod_public_files/convert.sh`,
   along with any docs that mention them.

Rollback: set `OAK_PHOTOS_SERVER_URL` back to `photos.oak.ffavs.net`. Keep
that host alive until the new URLs have been checked.

## Prod checklist

Run after steps 1–3, and again after step 5:

- [ ] Uploading a photo from the UI returns 200 on submit, and the photo
      shows as ready.
- [ ] `origin/`, `photos/` and `snaps/` each have the new file under
      `$REMOTE_HOME/photos` (after #335).
- [ ] `GET /photos/users/<uid>/items/<id>/<file>` and the `/snaps/` version
      return 200 with `Cache-Control: max-age=604800`.
- [ ] A missing photo returns 404, not a 302 to `/#/photos/...`.
- [ ] After another tagged deploy, the photos still load (the symlinks are
      recreated and the files are kept).
- [ ] Deleting the photo removes all three files.
- [ ] `configuration/locals.php` survives the deploy.

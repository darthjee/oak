# Photo Storage & Serving

Where photo files live in production, how the Tent proxy serves them, and
how to check it after a deploy. For what the upload and delete handlers
write, see [Resizing & Storage](../photo_upload/resizing-and-storage.md);
for the prod proxy config and CircleCI jobs, see
[Infrastructure](infrastructure.md#production-proxy-configuration).

## On-disk layout (prod)

Photos live outside the release directory, which every deploy replaces.
The `link_photos` job links them into each release:

```text
$REMOTE_HOME/
├── photos/                          # persistent storage root ($storageRoot)
│   ├── origin/users/<uid>/items/<id>/<file>
│   ├── photos/users/<uid>/items/<id>/<file>
│   └── snaps/users/<uid>/items/<id>/<file>
└── <site dir> = $SSH_REMOTE_DIR     # replaced on every release ($staticRoot)
    ├── index.php, .htaccess, ...    # Tent
    ├── configuration/               # proxy/prod_configuration/ + server-only locals.php
    ├── extension/                   # proxy/extension/
    ├── static/                      # frontend build
    ├── photos -> $REMOTE_HOME/photos/photos
    └── snaps  -> $REMOTE_HOME/photos/snaps
```

`origin/` is never linked or served: originals are kept, not shown.

**Serving invariant.** For every photo, these two paths are the same file:

```text
<storageRoot>/{photos,snaps}/<file_path>     (written by the upload handler)
<staticRoot>/{photos,snaps}/<file_path>      (read by the static rule)
```

The request URI `/{photos,snaps}/<file_path>` resolves to the second path.

## Static rules

`rules/photos.php` serves `GET /photos` and `GET /snaps` (`begins_with`,
`type => static`) from `$staticRoot` in prod and `/tmp/photos` in dev.

- Rule order: `frontend → photos/snaps static → uploads → deletes → backend
  → redirects`. The static photo rules come before the redirect catch-all,
  or a `GET /photos/...` becomes a 302 to `/#/photos/...`. Uploads and
  deletes come before `backend.php` so the custom handlers get the request
  first.
- `Oak\Proxy\CacheControlMiddleware` sets `Cache-Control: max-age=604800`
  (7 days) on **2xx responses only**: a cached 404 would hide a snap made
  later. Other responses are returned unchanged.
- A missing file returns Tent's 404, not a redirect.
- The 7-day cache is safe because a path is never reused: file names
  contain a UUID (`Oak::Photo::CreateBuilder#unique_file_name`).

## Dev vs prod

| Setting | Dev | Prod |
| --- | --- | --- |
| Config folder | `docker_volumes/proxy_configuration/` (mounted) | `proxy/prod_configuration/` (uploaded to `configuration/`) |
| Backend host | `http://backend:3000` | `$backendHost` |
| Storage root | `/tmp/photos` (mount of `dev_public_files`) | `$REMOTE_HOME/photos` |
| Static root | `/tmp/photos` (mount of `dev_public_files`) | release dir, with `photos` and `snaps` symlinks |
| Max upload size | `OAK_PHOTO_MAX_UPLOAD_SIZE_BYTES` env | `$maxUploadSizeBytes` |
| Extension | `./proxy/extension/` mount | uploaded to `extension/` |

## Photo URLs

`OAK_PHOTOS_SERVER_URL` (`Settings.photos_server_url`) is the base URL
`Oak::Photo::FileUrl` uses to build `<url>/{photos,snaps}/<file_path>`. In
prod it is the Oak (proxy) domain. Placeholder images (`category.png`,
`kind.png`) for objects without a main photo are root-relative
`/assets/images/` paths served by the frontend, and don't use it.

## Deploy notes

- `bin/deploy_frontend.sh link` uses `ln -sfn`, so re-running `link_photos`
  or the workflow replaces the links instead of nesting them.
- `release` removes the old release with `rm -rf`, which deletes the
  symlinks without following them.
- A workflow that fails before `release` leaves its
  `${SSH_REMOTE_TEMP_DIR}-$CIRCLE_WORKFLOW_WORKSPACE_ID` temp dir behind.
  Clean these up by hand now and then.

## Prod checklist

Smoke check after a deploy that touches photo upload or serving:

- [ ] Uploading a photo from the UI returns 200 on submit, and the photo
      shows as ready.
- [ ] `origin/`, `photos/` and `snaps/` each have the new file under
      `$REMOTE_HOME/photos`.
- [ ] `GET /photos/users/<uid>/items/<id>/<file>` and the `/snaps/` version
      return 200 with `Cache-Control: max-age=604800`.
- [ ] A missing photo returns 404, not a 302 to `/#/photos/...`.
- [ ] After another tagged deploy, the photos still load (the symlinks are
      recreated and the files are kept).
- [ ] Deleting the photo removes all three files.
- [ ] `configuration/locals.php` survives the deploy.

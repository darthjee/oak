# Deployment and Photo Folder Linking

CircleCI changes that ship the prod proxy config and extension, and link
the persistent photo folders into each release. The extension upload in
`upload_proxy_files` (#330) and the `link_photos` job (#331) are both done
and described below.

## Why

`deploy_frontend.sh release` swaps the release temp dir into
`$SSH_REMOTE_DIR`, so it replaces the whole site directory. Anything stored
inside the release is lost on the next deploy. Photos must live outside it,
in `$REMOTE_HOME/photos`, and be linked in on every release.

## Deploy script

Every deploy job calls `bin/deploy_frontend.sh`, committed in this repo and
copied as-is from Majora (`darthjee/majora`), not the script inside the
images. Compared with the image script:

- the release temp dir is per workflow:
  `${SSH_REMOTE_TEMP_DIR%/}-$CIRCLE_WORKFLOW_WORKSPACE_ID`. All jobs of one
  workflow build into the same dir, and a re-run of the workflow reuses it;
- subpaths inside it are given with `DEPLOY_PATH` instead of overriding
  `SSH_REMOTE_TEMP_DIR`;
- `link` runs `ln -sfn $SOURCE <temp dir>/$DEPLOY_PATH`, which replaces an
  existing link instead of following it (a plain `ln -s` would create a
  nested link such as `$REMOTE_HOME/photos/photos/photos` on a re-run);
- `release` swaps the per-workflow temp dir into `$SSH_REMOTE_DIR` and
  removes the old release with `rm -rf`, which deletes the symlinks without
  following them.

All jobs must switch together, since they must agree on the temp dir.

## Current state

- `upload_fe_files` (`darthjee/vite_oak-base`): `bin/deploy_frontend.sh build`,
  `generate_key_file`, `DEPLOY_PATH=static/ ... generate_folder`, then
  `SOURCE=dist/ DEPLOY_PATH=static/ bin/deploy_frontend.sh upload`.
- `upload_proxy_files` (`darthjee/tent:0.10.4`):
  1. `bin/deploy_frontend.sh generate_key_file`
  2. `SOURCE=/var/www/html/ bin/deploy_frontend.sh upload` (Tent's own files,
     including an empty `extension/loader.php`)
  3. `SOURCE=proxy/prod_configuration/ DEPLOY_PATH=configuration/ bin/deploy_frontend.sh upload`
     (the committed prod config, #339)
  4. `TARGET=configuration/locals.php DEPLOY_PATH=configuration bin/deploy_frontend.sh copy_files`
     (carries only the server-only `locals.php` forward from the live release)
  5. `SOURCE=proxy/extension/ DEPLOY_PATH=extension/ bin/deploy_frontend.sh upload`
     (#330: the real `loader.php` and `Oak\Proxy\*` handlers overwrite the
     empty `extension/loader.php` from step 2)
- `link_photos` (`darthjee/tent:0.10.4`): see below.
- `release` (`darthjee/vite_oak-base`): `bin/deploy_frontend.sh generate_key_file`,
  then `bin/deploy_frontend.sh release`. It requires `build-and-release`,
  `upload_proxy_files`, `upload_fe_files`, `link_photos` and the image
  releases.

## `upload_proxy_files`

Done. The prod config upload and the `locals.php` carry-forward came in
#339; #330 added the `proxy/extension/` upload as the last step of the same
job (step 5 above). It runs **after** the Tent upload, which ships an empty
`extension/loader.php` that would otherwise win.

## `link_photos`

Done (#331). Tag-only job on the Tent image:

1. `bin/deploy_frontend.sh generate_key_file`
2. `bin/deploy_frontend.sh generate_folder` (`mkdir -p` on the temp release
   dir)
3. `SOURCE=$REMOTE_HOME/photos/photos DEPLOY_PATH=photos bin/deploy_frontend.sh link`
4. `SOURCE=$REMOTE_HOME/photos/snaps DEPLOY_PATH=snaps bin/deploy_frontend.sh link`

Because it creates the temp dir itself, it depends on no upload job: it
requires the same test jobs as `upload_proxy_files` (`test`, `checks`,
`jasmine`, `frontend-checks`) and runs in parallel with the uploads.
`release` requires it. Neither the Tent files nor `static/` contain
`photos` or `snaps`, so `ln -sfn` always creates or replaces a top-level
link. Re-running the job or the workflow replaces the links rather than
nesting them. `origin/` is not linked: originals are never served.

See [examples.md](examples.md#link_photos-job) for the job and the
workflow entries.

## Environment and one-time setup

CircleCI project env vars:

| Variable | Use |
| --- | --- |
| `REMOTE_HOME` | Home dir on the Dreamhost host; parent of `photos/`. Must be a literal absolute path (not `~`): `SOURCE` is expanded on the CircleCI side |
| `SSH_REMOTE_DIR` | Live site dir |
| `SSH_REMOTE_TEMP_DIR` | Base of the release temp dir; the script appends `-$CIRCLE_WORKFLOW_WORKSPACE_ID` |
| `CIRCLE_WORKFLOW_WORKSPACE_ID` | Built into CircleCI; same for all jobs and re-runs of one workflow |
| `SSH_*` (host, port, user, key) | SSH connection; the key is written by `generate_key_file` |

One-time server setup, before the first release with `link_photos`
(without it, `ln -sfn` still succeeds but creates dangling links):

```bash
mkdir -p $REMOTE_HOME/photos/{origin,photos,snaps}
```

The real `locals.php` must already be in the live `configuration/` (the #339
bootstrap, see [Infrastructure](../../architecture/infrastructure.md#production-proxy-configuration)).
Before tagging the #330 release:

- add `$storageRoot` (e.g. `$REMOTE_HOME/photos`) and
  `$maxUploadSizeBytes = 10 * 1024 * 1024` to the live
  `configuration/locals.php` — a missing variable breaks every request, not
  only uploads;
- create `$REMOTE_HOME/photos/origin`;
- check the server's PHP `upload_max_filesize` and `post_max_size` are at
  least 10 MB.

## On-disk layout (prod)

Before `release`, the jobs build into
`${SSH_REMOTE_TEMP_DIR}-$CIRCLE_WORKFLOW_WORKSPACE_ID`; `release` moves it to
`$SSH_REMOTE_DIR`. A workflow that fails before `release` leaves its temp dir
behind; the next workflow uses a new one, so clean these up by hand now and
then.

```text
$REMOTE_HOME/
├── photos/                          # persistent storage root ($storageRoot)
│   ├── origin/users/<uid>/items/<id>/<file>
│   ├── photos/users/<uid>/items/<id>/<file>
│   └── snaps/users/<uid>/items/<id>/<file>
└── <site dir> = $SSH_REMOTE_DIR     # replaced on every release ($staticRoot)
    ├── index.php, .htaccess, ...    # Tent
    ├── configuration/
    │   ├── configure.php, rules/    # from proxy/prod_configuration/
    │   └── locals.php               # server only, carried forward
    ├── extension/                   # from proxy/extension/
    ├── static/                      # frontend build
    ├── photos -> $REMOTE_HOME/photos/photos
    └── snaps  -> $REMOTE_HOME/photos/snaps
```

The static rule serves `/photos/<file_path>` from
`$staticRoot/photos/<file_path>`, which through the symlink is
`$storageRoot/photos/<file_path>`. This is the invariant in the
[guide index](index.md#serving). Check that Tent's static handler follows
symlinks in prod (#332's checklist).

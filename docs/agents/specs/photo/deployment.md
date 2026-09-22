# Deployment and Photo Folder Linking

Target CircleCI changes that ship the prod proxy config and extension, and
link the persistent photo folders into each release. The extension upload
in `upload_proxy_files` belongs to #330, `link_photos` to #331. Except for
the "Current state" section, these are proposals.

## Why

`deploy_frontend.sh release` swaps `$SSH_REMOTE_TEMP_DIR` into
`$SSH_REMOTE_DIR`, so it replaces the whole site directory. Anything stored
inside the release is lost on the next deploy. Photos must live outside it,
in `$REMOTE_HOME/photos`, and be linked in on every release.

## Current state

- `upload_proxy_files` (`darthjee/tent:0.10.4`):
  1. `deploy_frontend.sh generate_key_file`
  2. `SOURCE=/var/www/html/ deploy_frontend.sh upload` (Tent's own files,
     including an empty `extension/loader.php`)
  3. `SOURCE=proxy/prod_configuration/ SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/configuration/ deploy_frontend.sh upload`
     (the committed prod config, #339)
  4. `TARGET=configuration/locals.php SSH_REMOTE_TEMP_DIR=$SSH_REMOTE_TEMP_DIR/configuration deploy_frontend.sh copy_files`
     (carries only the server-only `locals.php` forward from the live release)
- `proxy/extension/` is never uploaded.
- `release` requires `build-and-release`, `upload_proxy_files`,
  `upload_fe_files` and the image releases.

## `upload_proxy_files`

The prod config upload and the `locals.php` carry-forward are already in
place (#339). #330 only adds:

1. Upload `proxy/extension/` into `extension/`. It must run **after** the
   Tent upload, which ships an empty `extension/loader.php` that would
   otherwise win.

This can be a step of the same job or a separate job (Majora uses
`upload_extension`, requiring `upload_proxy_files`). Either way, `release`
must require it.

## `link_photos`

New tag-only job on the Tent image:

1. `deploy_frontend.sh generate_key_file`
2. `SOURCE=$REMOTE_HOME/photos/photos TARGET=$SSH_REMOTE_TEMP_DIR/photos deploy_frontend.sh link`
3. `SOURCE=$REMOTE_HOME/photos/snaps TARGET=$SSH_REMOTE_TEMP_DIR/snaps deploy_frontend.sh link`

Oak's `deploy_frontend.sh link` runs `ln -s $SOURCE $TARGET` on the server.
This differs from Majora, whose `link` takes `DEPLOY_PATH`. Check the
script inside the image before copying Majora's job.

`link_photos` must run after the temp dir exists (after
`upload_proxy_files`, or call `generate_folder` first), and `release` must
require it. `origin/` is not linked: originals are never served.

See [examples.md](examples.md#link_photos-job) for the job and the
`release` change.

## Environment and one-time setup

CircleCI project env vars:

| Variable | Use |
| --- | --- |
| `REMOTE_HOME` | New. Home dir on the Dreamhost host; parent of `photos/` |
| `SSH_REMOTE_DIR` | Existing. Live site dir |
| `SSH_REMOTE_TEMP_DIR` | Existing. Release temp dir |
| `SSH_*` (host, user, key) | Existing. Used by `generate_key_file` |

One-time server setup, before the first release with `link_photos`:

```bash
mkdir -p $REMOTE_HOME/photos/{origin,photos,snaps}
```

The real `locals.php` must already be in the live `configuration/` (the #339
bootstrap, see [Infrastructure](../../architecture/infrastructure.md#production-proxy-configuration)).
Add the new #330 variables (`$storageRoot`, `$maxUploadSizeBytes`) to it
before tagging the #330 release.

## On-disk layout (prod, target)

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

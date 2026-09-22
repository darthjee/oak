# Proxy Rules

Target Tent configuration for production photo upload and serving
(sub-issues #330, #332 and #335). Everything here is a proposal for those
sub-issues, not the current state. See the [guide index](index.md) for the path decision.

## Current state

- Dev config: `docker_volumes/proxy_configuration/`. `configure.php` loads
  `rules/frontend.php`, `backend.php`, `uploads.php`, `deletes.php` and
  `redirects.php`, in that order.
- `uploads.php` and `deletes.php` route to `Oak\Proxy\PhotoSubmitRequestHandler`
  and `Oak\Proxy\PhotoDeleteRequestHandler` with
  `photosPath => '/tmp/photos'` and host `http://backend:3000`.
- Prod config: only on the server, in `configuration/`, copied forward on
  each deploy. It has no upload, delete or photo rules.

## Versioned prod config

Add a versioned prod config next to the extension, e.g.
`proxy/prod_configuration/`:

```text
proxy/prod_configuration/
├── configure.php          # loads locals.php, then the rules
├── locals.php.sample      # committed; documents every variable
└── rules/
    ├── frontend.php
    ├── photos.php         # static /photos and /snaps (#332)
    ├── uploads.php
    ├── deletes.php
    ├── backend.php
    └── redirects.php
```

The real `locals.php` holds server values and stays on the server only. Add
it to `.gitignore`. CircleCI carries it forward from the live release (see
[Deployment](deployment.md)).

### `locals.php` variables

| Variable | Meaning |
| --- | --- |
| `$backendHost` | Rails backend URL (the Render service) |
| `$storageRoot` | Persistent photo root, with `origin/`, `photos/`, `snaps/` |
| `$staticRoot` | Root for the static photo rules (the release directory) |
| `$maxUploadSizeBytes` | Max accepted upload size, passed to the submit handler |

See [examples.md](examples.md#localsphpsample) for the sample file.

## Rule order

```text
frontend → photos/snaps static → uploads → deletes → backend → redirects
```

- Static photo rules come **before** the redirect catch-all. Otherwise a
  `GET /photos/...` is matched by the `redirects.php` regex and becomes a
  302 to `/#/photos/...`.
- Uploads and deletes come before `backend.php` and `redirects.php` so the
  custom handlers get the request first.
- Dev keeps its current order for now. #333 can align it.

## Static photo rules

- Two rules: `GET /photos` and `GET /snaps`, `begins_with`, `type => static`,
  `location => $staticRoot`.
- Add a `Cache-Control: max-age=604800` header (7 days).
- **Tent has no built-in `CacheControlMiddleware`.** Majora ships its own in
  `proxy/extension/lib/middlewares/`. #332 must port it into Oak's
  `proxy/extension/` (with a tent-test spec and a `loader.php` entry), or use
  a built-in if the Tent version in use has one.
- The 7-day cache is safe only while a new upload never reuses a path. The
  file name comes from the backend. If a re-upload can keep the same name,
  clients may see the old image for up to 7 days. #332 should confirm names
  are unique per upload, or use a shorter max-age.

See [examples.md](examples.md#static-photo-rules).

## Upload and delete rules

- Reuse the dev regex matchers and handler classes as they are:
  - `POST #^/uploads/categories/[^/]+/items/\d+/photos/\d+/submit/?$#`
  - `DELETE #^/uploads/categories/[^/]+/items/\d+/photos/\d+/?$#`
- `host` becomes `$backendHost`.
- **#330 (interim):** `photosPath => $storageRoot . '/origin'`. The handlers
  still write `<photosPath>/<file_path>` with no prefix, so originals land in
  `origin/` and never inside the release directory.
- **#335 (target):** the option becomes `storageRoot => $storageRoot`, and
  the handlers add the `origin/`, `photos/` and `snaps/` prefixes.
- #330's issue body calls the variable `$photosPath`. Use `$storageRoot`
  (the root) in `locals.php` and derive the `origin/` path in the rule, so
  #335 needs no `locals.php` change on the server.

See [examples.md](examples.md#upload-rule).

## Dev vs prod

| Setting | Dev | Prod |
| --- | --- | --- |
| Config folder | `docker_volumes/proxy_configuration/` (mounted) | `proxy/prod_configuration/` (uploaded to `configuration/`) |
| Backend host | `http://backend:3000` | `$backendHost` |
| Storage root | `/tmp/photos` (mount of `dev_public_files`) | `$REMOTE_HOME/photos` |
| Static root | `/tmp/photos` or a mount of `dev_public_files` | release dir, with `photos` and `snaps` symlinks |
| Max upload size | `OAK_PHOTO_MAX_UPLOAD_SIZE_BYTES` env | `$maxUploadSizeBytes` |
| Extension | `./proxy/extension/` mount | uploaded to `extension/` |

# Proxy Rules

Target Tent configuration for production photo upload and serving
(sub-issues #330, #332 and #335). #330 is done and described in "Current
state"; the static photo rules (#332) and the `storageRoot` option (#335)
are still proposals. See the [guide index](index.md) for the path decision.

## Current state

- Dev config: `docker_volumes/proxy_configuration/`. `configure.php` loads
  `rules/frontend.php`, `backend.php`, `uploads.php`, `deletes.php` and
  `redirects.php`, in that order.
- `uploads.php` and `deletes.php` route to `Oak\Proxy\PhotoSubmitRequestHandler`
  and `Oak\Proxy\PhotoDeleteRequestHandler` with
  `photosPath => '/tmp/photos'` and host `http://backend:3000`.
- Prod config: committed in `proxy/prod_configuration/` (#339, #330).
  `configure.php` requires `locals.php` first, then `rules/frontend.php`,
  `uploads.php`, `deletes.php`, `backend.php` and `redirects.php`. The rules
  read `$backendHost`, `$staticRoot`, `$storageRoot` and `$maxUploadSizeBytes`
  from `locals.php`, which is gitignored and exists only on the server.
  `upload_proxy_files` uploads the folder on every tag, carries `locals.php`
  forward and uploads `proxy/extension/` (see [Deployment](deployment.md)).
  It has no static photo rules yet (#332).
- Prod `uploads.php` and `deletes.php` (#330) use the dev regex matchers and
  handler classes with `host => $backendHost` and
  `photosPath => $storageRoot . '/origin'`; the submit rule also passes
  `maxUploadSizeBytes => $maxUploadSizeBytes` (10 MB in prod).
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` covers the prod
  rule order (including the upload and delete rules and their handler
  options) with inline locals.
- See [Infrastructure](../../architecture/infrastructure.md#production-proxy-configuration)
  for the `locals.php` bootstrap and update rules.

## Versioned prod config

Current layout plus the #332 addition:

```text
proxy/prod_configuration/
├── configure.php          # exists; add the new requires in rule order
├── locals.php.sample      # exists; add every new variable
└── rules/
    ├── frontend.php       # exists
    ├── photos.php         # new: static /photos and /snaps (#332)
    ├── uploads.php        # exists (#330)
    ├── deletes.php        # exists (#330)
    ├── backend.php        # exists
    └── redirects.php      # exists
```

The real `locals.php` holds server values and stays on the server only. It
is already gitignored and carried forward by CircleCI. Every new variable
must be added to `locals.php.sample` in the same PR **and** to the live
`locals.php` before tagging.

### `locals.php` variables

| Variable | Meaning | Status |
| --- | --- | --- |
| `$backendHost` | Rails backend URL | exists (#339) |
| `$staticRoot` | Release directory; the frontend is served from `$staticRoot . '/static'`, the static photo rules from `$staticRoot` | exists (#339) |
| `$storageRoot` | Persistent photo root, with `origin/`, `photos/`, `snaps/` | exists (#330) |
| `$maxUploadSizeBytes` | Max accepted upload size, passed to the submit handler (10 MB) | exists (#330) |

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

Implemented in #330 (see "Current state"); #335 is still a proposal.

- Reuse the dev regex matchers and handler classes as they are:
  - `POST #^/uploads/categories/[^/]+/items/\d+/photos/\d+/submit/?$#`
  - `DELETE #^/uploads/categories/[^/]+/items/\d+/photos/\d+/?$#`
- `host` becomes `$backendHost`.
- **#330 (current):** `photosPath => $storageRoot . '/origin'`. The handlers
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

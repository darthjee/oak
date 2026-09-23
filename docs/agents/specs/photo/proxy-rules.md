# Proxy Rules

Target Tent configuration for production photo upload and serving
(sub-issues #330, #332 and #335). #330 and #332 are done and described in
"Current state"; the `storageRoot` option (#335) is still a proposal. See
the [guide index](index.md) for the path decision.

## Current state

- Dev config: `docker_volumes/proxy_configuration/`. `configure.php` loads
  `rules/frontend.php`, `photos.php`, `backend.php`, `uploads.php`,
  `deletes.php` and `redirects.php`, in that order.
- Dev `photos.php` (#332) serves `GET /photos/...` and `GET /snaps/...` from
  `/tmp/photos` (the `./dev_public_files` mount) with
  `Oak\Proxy\CacheControlMiddleware`.
- `uploads.php` and `deletes.php` route to `Oak\Proxy\PhotoSubmitRequestHandler`
  and `Oak\Proxy\PhotoDeleteRequestHandler` with
  `photosPath => '/tmp/photos/origin'` (#333, matching prod's #330 interim;
  originals land in `dev_public_files/origin/`) and host
  `http://backend:3000`.
- Prod config: committed in `proxy/prod_configuration/` (#339, #330).
  `configure.php` requires `locals.php` first, then `rules/frontend.php`,
  `photos.php`, `uploads.php`, `deletes.php`, `backend.php` and
  `redirects.php`. The rules read `$backendHost`, `$staticRoot`,
  `$storageRoot` and `$maxUploadSizeBytes` from `locals.php`, which is
  gitignored and exists only on the server.
  `upload_proxy_files` uploads the folder on every tag, carries `locals.php`
  forward and uploads `proxy/extension/` (see [Deployment](deployment.md)).
- Prod `photos.php` (#332) serves `GET /photos/...` and `GET /snaps/...` from
  `$staticRoot` (the release dir, with `photos` and `snaps` symlinks) with
  `Oak\Proxy\CacheControlMiddleware`.
- Prod `uploads.php` and `deletes.php` (#330) use the dev regex matchers and
  handler classes with `host => $backendHost` and
  `photosPath => $storageRoot . '/origin'`; the submit rule also passes
  `maxUploadSizeBytes => $maxUploadSizeBytes` (10 MB in prod).
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` covers the prod
  rule order (including the static photo rules, the upload and delete rules
  and their handler options) with inline locals.
- See [Infrastructure](../../architecture/infrastructure.md#production-proxy-configuration)
  for the `locals.php` bootstrap and update rules.

## Versioned prod config

Current layout:

```text
proxy/prod_configuration/
├── configure.php          # requires the rules in rule order
├── locals.php.sample      # add every new variable
└── rules/
    ├── frontend.php       # exists
    ├── photos.php         # exists: static /photos and /snaps (#332)
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
- Dev inserts `photos.php` right after `frontend.php`, before the redirect
  catch-all; the rest of the dev order is unchanged. #333 can align it
  fully with prod.

## Static photo rules

- Two rules: `GET /photos` and `GET /snaps`, `begins_with`, `type => static`,
  `location => $staticRoot`.
  Dev uses `location => '/tmp/photos'`.
- `Oak\Proxy\CacheControlMiddleware` (`proxy/extension/`, ported from
  Majora, spec in `proxy/extension_tests/`) sets
  `Cache-Control: max-age=604800` (7 days). Tent 1.0.0 still has no response-side
  cache-control middleware.
- The header is set on **2xx responses only**. Snaps are generated after the
  upload, so an early `GET /snaps/...` returns 404; a cached 404 would hide
  the snap for the whole max-age. Non-2xx responses are returned unchanged.
- A missing file under `/photos` or `/snaps` returns Tent's 404 (no
  `max-age`); it does not fall through to the redirect rule.
- The 7-day cache is safe because a path is never reused: file names include
  a UUID (`Oak::Photo::CreateBuilder#unique_file_name`).

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
| Static root | `/tmp/photos` (mount of `dev_public_files`) | release dir, with `photos` and `snaps` symlinks |
| Max upload size | `OAK_PHOTO_MAX_UPLOAD_SIZE_BYTES` env | `$maxUploadSizeBytes` |
| Extension | `./proxy/extension/` mount | uploaded to `extension/` |

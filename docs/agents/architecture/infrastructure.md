# Infrastructure

The Docker service topology (proxy, Rails app, database, queue, background jobs, photo serving) and how frontend-serving requests get routed through the reverse proxy to Rails.

## Service Topology

```
Browser
  │
  ▼
darthjee/tent (proxy)          ← caches HTML; port 3000 in dev
  │
  ▼
Rails app (oak_app)            ← port 3010 in dev, 3000 internally
  ├── MySQL (oak_mysql)        ← primary database
  ├── Redis (oak_redis)        ← Sidekiq queue
  ├── Sidekiq (oak_sidekiq)    ← background jobs (photo processing)
  └── Apache httpd (oak_photos) ← static photo/file serving; port 3001
```

In production there is no `oak_photos` container; uploaded files are served by the production infrastructure directly.

---

## Request Routing

Frontend-serving requests follow one of these paths:

| Pattern | Behaviour |
|---------|-----------|
| `GET /` | Serves the SPA shell (`index.html`) handled by `HomeController`, which boots the React app. |
| `GET /<path>` (HTML) | Redirected to `/#/<path>` by the Tent proxy (`rules/redirects.php`) before the request reaches Rails. |
| `GET /<path>.json` | Returns JSON payloads for frontend data loading via Azeroth decorators. |

All redirect and HTML cache logic lives exclusively in the Tent proxy configuration.

---

## Production Proxy Configuration

The production Tent rules are versioned in `proxy/prod_configuration/`. The dev
rules in `docker_volumes/proxy_configuration/` are separate and are not
deployed.

```text
proxy/prod_configuration/
├── configure.php          # requires locals.php first, then the rules
├── locals.php.sample      # committed; documents every variable
└── rules/
    ├── frontend.php       # GET / and GET /assets* from $staticRoot . '/static'
    ├── uploads.php        # POST .../photos/:id/submit -> PhotoSubmitRequestHandler
    ├── deletes.php        # DELETE .../photos/:id -> PhotoDeleteRequestHandler
    ├── backend.php        # *.json proxied to $backendHost
    └── redirects.php      # GET /<path> -> /#/<path>, loaded last
```

- **Deploy:** on every tag, the CircleCI job `upload_proxy_files` uploads
  `proxy/prod_configuration/` into the release's `configuration/` folder, then
  copies only `configuration/locals.php` forward from the live release. It
  then uploads `proxy/extension/` into the release's `extension/` folder,
  overwriting the empty `extension/loader.php` shipped with the Tent files, so
  the `Oak\Proxy\*` handlers used by `uploads.php`/`deletes.php` are loaded.
  Every deploy job calls the repo's `bin/deploy_frontend.sh` (copied from
  Majora), not the image script. All jobs build into the same per-workflow
  temp dir, `${SSH_REMOTE_TEMP_DIR}-$CIRCLE_WORKFLOW_WORKSPACE_ID`, and give
  subpaths with `DEPLOY_PATH`. The tag-only `link_photos` job links
  `$REMOTE_HOME/photos/photos` and `$REMOTE_HOME/photos/snaps` (inside
  `$storageRoot`) into each release as `photos` and `snaps` with `ln -sfn`,
  which is safe to re-run. `release` requires it.
- **`locals.php` is server-only.** It holds the host-specific values
  (`$backendHost`, `$staticRoot`, `$storageRoot`, `$maxUploadSizeBytes`), is
  gitignored
  (`proxy/prod_configuration/locals.php`) and is never uploaded by CI.
- **Photo storage:** `$storageRoot` is the persistent photo root (holding
  `origin/`, `photos/` and `snaps/`), outside the release directory. The
  upload/delete handlers take it as their `storageRoot` option (#335): submit
  writes the original and the resized `photos/`/`snaps/` versions, delete
  removes all three.
  `$maxUploadSizeBytes` is 10 MB in production; PHP's `upload_max_filesize`
  and `post_max_size` on the server must be at least that.
- **One-time bootstrap:** before the first tag that uses this flow, create
  `$SSH_REMOTE_DIR/configuration/locals.php` on the server by hand from
  `locals.php.sample`. CI does not create it, and without it the
  `copy_files` step fails. Also set the CircleCI project env var
  `REMOTE_HOME` to a literal absolute path (it is expanded on the CI side, so
  not `~`) and run `mkdir -p $REMOTE_HOME/photos/{origin,photos,snaps}` on the
  server; otherwise `link_photos` creates dangling links.
- **New variables:** when a rule needs a new variable, add it to
  `locals.php.sample` in the same PR **and** to the live `locals.php` on the
  server before tagging the release.
- **Hand edits:** edits to the live `locals.php` take effect immediately and
  are not versioned. Mirror any lasting change in `locals.php.sample`.
- **Tests:** `proxy/extension_tests/ProdConfigurationRoutingTest.php` sets the
  locals inline and checks the rule order (`docker compose run --rm extension_tests`).

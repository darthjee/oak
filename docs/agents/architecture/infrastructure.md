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
    ├── backend.php        # *.json proxied to $backendHost
    └── redirects.php      # GET /<path> -> /#/<path>, loaded last
```

- **Deploy:** on every tag, the CircleCI job `upload_proxy_files` uploads
  `proxy/prod_configuration/` into the release's `configuration/` folder, then
  copies only `configuration/locals.php` forward from the live release.
- **`locals.php` is server-only.** It holds the host-specific values
  (`$backendHost`, `$staticRoot`), is gitignored
  (`proxy/prod_configuration/locals.php`) and is never uploaded by CI.
- **One-time bootstrap:** before the first tag that uses this flow, create
  `$SSH_REMOTE_DIR/configuration/locals.php` on the server by hand from
  `locals.php.sample`. CI does not create it, and without it the
  `copy_files` step fails.
- **New variables:** when a rule needs a new variable, add it to
  `locals.php.sample` in the same PR **and** to the live `locals.php` on the
  server before tagging the release.
- **Hand edits:** edits to the live `locals.php` take effect immediately and
  are not versioned. Mirror any lasting change in `locals.php.sample`.
- **Tests:** `proxy/extension_tests/ProdConfigurationRoutingTest.php` sets the
  locals inline and checks the rule order (`docker compose run --rm extension_tests`).

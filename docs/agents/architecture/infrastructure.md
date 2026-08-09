# Infrastructure

The Docker service topology (proxy, Rails app, database, queue, background jobs, photo serving) and how frontend-serving requests get routed through the reverse proxy to Rails.

## Infrastructure

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

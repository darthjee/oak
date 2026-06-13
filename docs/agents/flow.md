# Flow

## Entry Points

A user can arrive at the application through three entry points:

| Entry point | What happens |
|-------------|--------------|
| `GET /` | Rails serves the SPA shell (`index.html`) with frontend assets. React boots and takes over. |
| `GET /<path>` | Tent proxy redirects the browser to `/#/<path>` (302). No content is rendered directly. |
| `/#/<path>` directly | The browser already has the SPA shell. React route resolution picks the page from the hash path. |

---

## SPA Page Load

Once the browser is on any `/#/<path>` — including `/#/` — React resolves the hash route and the page controller fetches JSON data as needed:

```
Browser on /#/<path>
        │
        └── GET /<path>.json       →  Rails returns the JSON data for that resource
                │
                ▼
        React renders/updates the page
```

When `FRONTEND_DEV_MODE=true`, Tent proxies frontend assets and Vite endpoints to `frontend:8080`. When disabled, Tent serves built static files from `/var/www/html/static`. See [HOW_TO_USE_DARTHJEE-TENT.md](HOW_TO_USE_DARTHJEE-TENT.md) for proxy configuration details.

---

## Auxiliary Routes

Some routes exist to support the application but are **not SPA resources** — they have no `?ajax=true` template and no `.json` representation:

| Route | Purpose |
|-------|---------|
| `POST /users/login` | Authenticates a user; returns a session, not a page. |
| `DELETE /users/logoff` | Destroys the session. |
| `GET /users/login/check` | Checks whether the current session is valid. |
| `GET /forbidden` | Returns `403 Forbidden` (used for authorization redirects). |

These are called by frontend clients/controllers directly (e.g., on form submit) and their responses are handled in JS, not by rendering a new page.

---

## Complete Flow Examples

### User types `oakapp.com/categories` in the browser

```
GET /categories
  → 302 redirect to /#/categories        (Tent proxy redirect rule)

Browser loads /#/categories
  → GET /            (if shell not yet loaded)
      Rails renders full layout + JS/CSS assets

React resolves /#/categories:
  → GET /categories.json                 → JSON data
  React renders the categories list
```

### User clicks a link inside the SPA (e.g., to `/categories/electronics`)

```
The frontend updates the anchor to /#/categories/electronics

React route resolver handles:
  → GET /categories/electronics.json       → JSON data
  React renders the category detail page
  (no full page reload)
```

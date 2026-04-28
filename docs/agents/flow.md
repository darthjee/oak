# Flow

## Entry Points

A user can arrive at the application through three entry points:

| Entry point | What happens |
|-------------|--------------|
| `GET /` | Rails renders the SPA shell: the full HTML page with the application layout, loading all JS and CSS assets. AngularJS boots and takes over. |
| `GET /<path>` | Rails (via `OnePageApplication` + Tarquinn) redirects the browser to `/#/<path>`. No content is rendered directly. |
| `/#/<path>` directly | The browser already has the SPA shell. AngularJS/Cyberhawk intercepts the anchor and loads the page content (see below). |

---

## SPA Page Load

Once the browser is on any `/#/<path>` — including `/#/` — Cyberhawk makes two parallel requests to populate the page:

```
Browser on /#/<path>
        │
        ├── GET /<path>?ajax=true  →  Rails returns the ERB template fragment (no layout)
        │                                        (cached by darthjee/tent proxy)
        └── GET /<path>.json       →  Rails returns the JSON data for that resource
                │
                ▼
        AngularJS merges template + data and renders the page
```

The proxy (**darthjee/tent**) caches the `?ajax=true` HTML responses, so repeated visits to the same page are served from cache without hitting Rails.

---

## Auxiliary Routes

Some routes exist to support the application but are **not SPA resources** — they have no `?ajax=true` template and no `.json` representation:

| Route | Purpose |
|-------|---------|
| `POST /users/login` | Authenticates a user; returns a session, not a page. |
| `DELETE /users/logoff` | Destroys the session. |
| `GET /users/login/check` | Checks whether the current session is valid. |
| `GET /forbidden` | Returns `403 Forbidden` (used for authorization redirects). |

These are called by AngularJS directly (e.g., on form submit) and their responses are handled in JS, not by rendering a new page.

---

## Complete Flow Examples

### User types `oakapp.com/categories` in the browser

```
GET /categories
  → 302 redirect to /#/categories        (OnePageApplication concern)

Browser loads /#/categories
  → GET /            (if shell not yet loaded)
      Rails renders full layout + JS/CSS assets

Cyberhawk intercepts /#/categories:
  → GET /categories?ajax=true            → template fragment (possibly from proxy cache)
  → GET /categories.json                 → JSON data
  AngularJS renders the categories list
```

### User clicks a link inside the SPA (e.g., to `/categories/electronics`)

```
AngularJS updates the anchor to /#/categories/electronics

Cyberhawk intercepts:
  → GET /categories/electronics?ajax=true  → template fragment
  → GET /categories/electronics.json       → JSON data
  AngularJS renders the category detail page
  (no full page reload)
```

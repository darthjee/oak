# Plan: Define Generic Client

## Overview

Extract the repeated fetch + query-param forwarding + pagination-header reading logic from
individual page controllers into a single `GenericClient`. Update existing controllers to use
it. All future controllers use `GenericClient` from the start, ensuring consistent behaviour
across pages.

Sub-issue of [#92 — Use React Front-End](../../issues/92-used-react-front-end.md).
Depends on [#108 — Handle Query Params on Category Index Page](../../issues/108-handle-query-params-on-category-index-page.md)
(the pattern being extracted is first established there).

---

## Context

After issues #95, #107, and #108, `CategoriesController` does three things that every future
index controller will also need to do:

1. Read query params from `window.location.hash` and append them to the fetch URL
2. Call `fetch` and parse the JSON body
3. Read `page`, `pages`, `per_page` from response headers (index pages only)

`GenericClient` centralises these three responsibilities so controllers stay thin.

---

## Implementation Steps

### Step 1 — `GenericClient.js`

Create `frontend/assets/js/client/GenericClient.js`.

Import `getHashQueryParams` from the existing utility (already created in issue #108):
`frontend/assets/js/components/helpers/hashQueryParams.js`.

```js
import getHashQueryParams from '../components/helpers/hashQueryParams.js';

export default class GenericClient {
  #hashProvider;

  constructor(hashProvider = () => window.location.hash) {
    this.#hashProvider = hashProvider;
  }

  #buildUrl(path) {
    const params = getHashQueryParams(this.#hashProvider());
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  async fetch(path) {
    const response = await window.fetch(this.#buildUrl(path), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Request failed for ${path}`);
    }
    return response.json();
  }

  async fetchIndex(path) {
    const response = await window.fetch(this.#buildUrl(path), {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Request failed for ${path}`);
    }
    const data = await response.json();
    const pagination = this.#extractPagination(response.headers);
    return { data, pagination };
  }

  #extractPagination(headers) {
    const pages = this.#parsePositiveInteger(headers.get('pages'), 1);
    const page  = this.#clamp(this.#parsePositiveInteger(headers.get('page'), 1), 1, pages);
    const perPage = this.#parsePositiveInteger(headers.get('per_page'), 10);
    return { page, pages, perPage };
  }

  #parsePositiveInteger(value, fallback) {
    const parsed = Number.parseInt(value, 10);
    return (Number.isNaN(parsed) || parsed < 1) ? fallback : parsed;
  }

  #clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
}
```

- Exported as a **class** (not a singleton) so controllers can inject a test instance.
- `hashProvider` is injected in the constructor so tests can pass a custom function.
- `fetch(path)` — forwards hash query params, throws on non-ok, returns parsed JSON.
- `fetchIndex(path)` — same but also returns a `pagination` object.

### Step 2 — Update `CategoriesController.js`

Add a `client` constructor parameter (default `new GenericClient(hashProvider)`) and replace
the inline fetch, URL-building, and pagination-parsing code with calls to the client.

```js
import GenericClient from '../../../client/GenericClient.js';

constructor(
  setCategories, setPagination, setLogged, setLoading, setError,
  hashProvider = () => window.location.hash,
  client = null
) {
  this.hashProvider = hashProvider;
  this.client = client ?? new GenericClient(hashProvider);
  // ... other assignments unchanged
}
```

Replace `#fetchCategories()` with a delegation to `client.fetchIndex`:

```js
#fetchCategories() {
  return this.client.fetchIndex('/categories.json')
    .catch(() => { throw new Error('Unable to load categories.'); });
}
```

Remove `#categoriesPath()`, `#extractPagination()`, `#parsePositiveInteger()`, and
`#clamp()` from the controller — those are now handled by `GenericClient`.

Keep `#checkLogin()` as a direct `fetch` call — it must **not** forward pagination params
to the login endpoint, so it should not go through `GenericClient`.

### Step 3 — `hashQueryParams.js` utility

`getHashQueryParams` was created in issue #108 and lives at:
`frontend/assets/js/components/helpers/hashQueryParams.js`

`GenericClient` imports it from that path (see Step 1). The utility file itself is **not**
deleted — it is still used by any caller that needs raw params without a full client call.

### Step 4 — Tests

| Spec file | What it tests |
|-----------|---------------|
| `spec/client/GenericClient_spec.js` | `fetch` appends hash params to URL; `fetchIndex` returns data + pagination; both handle the no-params case; `fetchIndex` falls back correctly when headers are absent; `fetch` and `fetchIndex` throw on non-ok response |
| `spec/components/pages/controllers/CategoriesController_spec.js` | Update — inject a mock `client` via the constructor instead of stubbing `global.fetch`; verify `client.fetchIndex` is called with `/categories.json` and that `#checkLogin` still hits `global.fetch` directly |

For `GenericClient_spec.js`, inject a custom `hashProvider` to control the hash value and
stub `global.fetch` to control the HTTP response — consistent with all other spec files in
the project.

---

## Files to Create / Change

| File | Action |
|------|--------|
| `frontend/assets/js/client/GenericClient.js` | Create |
| `frontend/assets/js/components/pages/controllers/CategoriesController.js` | Update — inject `GenericClient` via constructor; remove inline URL-building and pagination-parsing |
| `spec/client/GenericClient_spec.js` | Create |
| `spec/components/pages/controllers/CategoriesController_spec.js` | Update — inject mock client via constructor |

---

## Notes

- All future page controllers should receive a `GenericClient` instance via their constructor
  (defaulting to `new GenericClient(hashProvider)`) and call `client.fetch` or
  `client.fetchIndex` — never call `window.fetch` directly from a controller.
- Because `GenericClient` internally calls `window.fetch`, controller specs that inject a
  real `GenericClient` can still stub `global.fetch`. Specs for `GenericClient` itself also
  stub `global.fetch` and inject a `hashProvider` function — consistent with all other specs.
- If a page is not clearly "index" or "show" (e.g. a search page with pagination but no slug),
  use `fetchIndex` — the pagination object is simply ignored if the helper doesn't render it.
- Future improvements (auth token injection, base-URL config, error normalisation) should be
  added to `GenericClient` rather than to individual controllers.

## CI Checks

Before opening a PR, run the following for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)

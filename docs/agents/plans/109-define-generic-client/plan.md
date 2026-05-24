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

```js
class GenericClient {
  #getHashQueryParams() {
    const hash = window.location.hash;
    const queryString = hash.includes('?') ? hash.split('?')[1] : '';
    return new URLSearchParams(queryString);
  }

  #buildUrl(path) {
    const params = this.#getHashQueryParams();
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  async fetch(path) {
    const response = await window.fetch(this.#buildUrl(path));
    return response.json();
  }

  async fetchIndex(path) {
    const response = await window.fetch(this.#buildUrl(path));
    const data = await response.json();
    const pagination = {
      page:    parseInt(response.headers.get('page'),     10) || 1,
      pages:   parseInt(response.headers.get('pages'),    10) || 1,
      perPage: parseInt(response.headers.get('per_page'), 10) || 10,
    };
    return { data, pagination };
  }
}

export default new GenericClient();
```

- `fetch(path)` — forwards hash query params, returns parsed JSON (for show/detail pages)
- `fetchIndex(path)` — same but also returns a `pagination` object (for index pages)
- Exported as a singleton so all controllers share one instance

### Step 2 — Update `CategoriesController.jsx`

Replace the manual `fetch` calls with `GenericClient`:

```js
import client from '../../client/GenericClient';

buildEffect() {
  return () => {
    Promise.all([
      client.fetchIndex('/categories.json'),
      client.fetch('/users/login.json'),
    ])
      .then(([{ data, pagination }, loginData]) => {
        this.#setCategories(data);
        this.#setPagination(pagination);
        this.#setLogged(loginData.logged);
      })
      .catch(err => this.#setError(err.message))
      .finally(() => this.#setLoading(false));
  };
}
```

Remove any inline hash-param parsing and header-reading code from the controller.

### Step 3 — Remove the `hashQueryParams` utility (if extracted in #108)

If `getHashQueryParams` was extracted to `frontend/assets/js/utils/hashQueryParams.js` in
issue #108, it can be inlined into `GenericClient` and the utility file deleted, or kept and
imported by `GenericClient`. Prefer inlining to avoid a trivial one-function module.

### Step 4 — Tests

| Spec file | What it tests |
|-----------|---------------|
| `spec/client/GenericClient_spec.js` | `fetch` appends hash params; `fetchIndex` returns data + pagination; both handle no-params case; `fetchIndex` falls back gracefully when headers are absent |
| `spec/components/pages/controllers/CategoriesController_spec.js` | Update — stub `GenericClient` instead of `window.fetch` directly |

---

## Files to Create / Change

| File | Action |
|------|--------|
| `frontend/assets/js/client/GenericClient.js` | Create |
| `frontend/assets/js/components/pages/controllers/CategoriesController.jsx` | Update — use `GenericClient` |
| `spec/client/GenericClient_spec.js` | Create |
| `spec/components/pages/controllers/CategoriesController_spec.js` | Update — stub `GenericClient` |

---

## Notes

- All future page controllers should import `GenericClient` and call `fetch` or `fetchIndex`
  — never call `window.fetch` directly from a controller.
- The singleton export pattern means tests must stub or spy on the instance methods rather
  than `window.fetch`; document this in the spec as the established pattern.
- If a page is not clearly "index" or "show" (e.g. a search page with pagination but no slug),
  use `fetchIndex` — the pagination object is simply ignored if the helper doesn't render it.
- Future improvements (auth token injection, base-URL config, error normalisation) should be
  added to `GenericClient` rather than to individual controllers.

## CI Checks

Before opening a PR, run the following for the `frontend/` folder:

- `frontend/`: `docker-compose exec oak_fe npm test` (CircleCI job: `jasmine`)
- `frontend/`: `docker-compose exec oak_fe npm run lint` (CircleCI job: `frontend-checks`)

# Plan: Fix Pagination

## Overview

Pagination links in the new React frontend change the URL hash (e.g., `#/categories` → `#/categories?page=2&per_page=10`) but the page content is never reloaded. There are two separate bugs, both in the frontend routing layer.

## Context

The new frontend (under `frontend/`) is a React/Vite SPA that routes via the URL hash. `AppController` listens for `hashchange` events and calls `setPage()` to switch between page components. Page components use `useEffect` (with the controller as dependency) to fetch data once on mount.

Pagination links are rendered by `PaginationHelper` (elements) and `PageLink`, which produce `<a href="/#/categories?page=2&per_page=10">` links. When clicked, the browser fires a `hashchange` event.

## Root Causes

### Bug 1 — `HashRouteResolver.getPage()` does not handle query params for `categories` and `kinds`

`HashRouteResolver.getPage()` checks routes in order. For `categoryItem` and `categoryItems` it already uses regex with an optional `(\?.*)?` group. But for `categories` and `kinds` it uses strict string equality:

```javascript
if (hash === '#/categories' || hash === '#/categories/') {
  return 'categories';
}
if (hash === '#/kinds' || hash === '#/kinds/') {
  return 'kinds';
}
```

After clicking a pagination link, the hash becomes `#/categories?page=2&per_page=10`, which matches neither condition. `getPage()` falls through and returns `'home'`, navigating the user to the placeholder home page instead of staying on the categories page.

### Bug 2 — Page components do not re-fetch when hash query params change on the same page

Even if `getPage()` returns the correct page identifier (e.g., `'categoryItems'`), if the user is already on that page, calling `setPage('categoryItems')` does not change React state (it is already `'categoryItems'`), so no re-render and no re-fetch occurs.

Each page controller (`CategoriesController`, `CategoryItemsController`, etc.) fetches data once via `useEffect(() => ..., [controller])`. The controller is created once (`useMemo(..., [])`), so the effect never re-runs when query params change.

## Implementation Steps

### Step 1 — Fix `HashRouteResolver.getPage()` regex

Replace the strict string comparisons for `categories` and `kinds` with regex patterns that allow an optional query string, matching the pattern already used for `categoryItem` and `categoryItems`.

**File:** `frontend/assets/js/utils/HashRouteResolver.js`

Change:
```javascript
if (hash === '#/categories' || hash === '#/categories/') {
  return 'categories';
}

if (hash === '#/kinds' || hash === '#/kinds/') {
  return 'kinds';
}
```

To:
```javascript
if (/^#\/categories\/?(\?.*)?$/.test(hash)) {
  return 'categories';
}

if (/^#\/kinds\/?(\?.*)?$/.test(hash)) {
  return 'kinds';
}
```

Add failing specs first in `frontend/spec/utils/HashRouteResolver_spec.js`:
- `getPage()` returns `'categories'` for `#/categories?page=2&per_page=10`
- `getPage()` returns `'kinds'` for `#/kinds?page=2&per_page=10`

### Step 2 — Track hash state in `App.jsx` and use it as a React key

The root cause of Bug 2 is that React does not re-render (and thus does not re-fetch) when the page type stays the same but the URL changes. The fix is to use the full URL hash as a React `key` for the page content in `AppHelper.render()`. When the key changes, React unmounts and remounts the component, which re-runs the `useEffect` and triggers a fresh data fetch with the new query params.

**File: `frontend/assets/js/components/App.jsx`**

Add a `hash` state (initialized from `window.location.hash`) alongside the existing `page` state. Pass `hash` to `controller.renderPage()`.

```jsx
export default function App() {
  const [page, setPage] = useState(() => new AppController(null).getPage());
  const [hash, setHash] = useState(() => typeof window === 'undefined' ? '' : window.location.hash);

  const controller = useMemo(() => new AppController(setPage, window, () => window.location.hash, setHash), []);

  useEffect(() => {
    const effect = controller.buildEffect();
    return effect();
  }, [controller]);

  return controller.renderPage(page, hash);
}
```

**File: `frontend/assets/js/components/AppController.js`**

- Add `setHash` as the 4th constructor parameter (optional, defaults to `null`) so existing tests keep working.
- In `buildEffect()`, call `setHash(window.location.hash)` whenever the hash changes.
- Update `renderPage(page, hash)` to forward the hash to `AppHelper.render`.

**File: `frontend/assets/js/components/helpers/AppHelper.jsx`**

- Add a `hash` parameter to `render(page, hash)`.
- Wrap the page content in a `<React.Fragment key={hash}>` so that a hash change forces React to remount the page component.

```jsx
static render(page, hash = '') {
  return (
    <>
      <Header />
      <React.Fragment key={hash}>
        {PAGES[page]}
      </React.Fragment>
    </>
  );
}
```

Add specs to verify that `AppHelper.render` forwards the hash to the key (test indirectly via observed re-mount behavior or by checking that calling render with two different hashes produces elements with different keys).

### Step 3 — Update specs

- **`frontend/spec/utils/HashRouteResolver_spec.js`**: add cases for `#/categories?page=2` and `#/kinds?page=2`.
- **`frontend/spec/components/app/AppController_spec.js`**:
  - Add a test that `buildEffect` calls `setHash` when the hash changes.
  - Add tests for `renderPage` accepting a hash argument.
- **`frontend/spec/components/helpers/AppHelper_spec.js`**: add a test that `render` accepts a hash argument without breaking.
- **`frontend/spec/components/App_spec.js`**: keep existing tests passing (no breaking changes).

## Files to Change

- `frontend/assets/js/utils/HashRouteResolver.js` — fix `getPage()` regex for `categories` and `kinds`
- `frontend/assets/js/components/App.jsx` — add `hash` state, pass it to controller
- `frontend/assets/js/components/AppController.js` — accept `setHash`, update `buildEffect` and `renderPage`
- `frontend/assets/js/components/helpers/AppHelper.jsx` — use `hash` as React key for page content
- `frontend/spec/utils/HashRouteResolver_spec.js` — add query-param test cases
- `frontend/spec/components/app/AppController_spec.js` — test `setHash` behavior
- `frontend/spec/components/helpers/AppHelper_spec.js` — test hash parameter
- `frontend/spec/components/App_spec.js` — keep existing tests passing

## CI Checks

Before opening a PR, run the following checks for the `frontend/` folder:

- `frontend/`: `cd frontend && yarn test` (CircleCI job: `jasmine`)
- `frontend/`: `cd frontend && npm run lint` (CircleCI job: `frontend-checks`)

## Notes

- `AppController`'s constructor already receives `eventTarget` and `locationProvider` as parameters for testability. Adding `setHash` as a 4th parameter maintains backward compatibility with all existing tests.
- `React.Fragment` accepts a `key` prop; changing the key forces React to unmount and remount the fragment's children, which is the intended behavior.
- The `PAGES` constant in `AppHelper` contains pre-created JSX elements. This is fine — React reconciles by key, not by element identity.
- This fix makes all paginated list pages (`categories`, `categoryItems`, `kinds`) correctly re-fetch data when navigating between pages via pagination links.

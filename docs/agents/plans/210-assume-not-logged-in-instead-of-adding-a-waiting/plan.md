# Plan: Assume not logged in instead of adding a waiting

Issue: [210-assume-not-logged-in-instead-of-adding-a-waiting.md](../../issues/210-assume-not-logged-in-instead-of-adding-a-waiting.md)

## Overview

The navigation header (`Header.jsx`) currently waits for both `GET /users/login.json` and `GET /user/categories.json` to resolve before rendering anything, showing "Loading navigation..." in the meantime. Since the login check almost always resolves to "not logged in", this is the same class of problem already fixed for page-level loading in issue #207 (commit `a84a005`). Apply the same pattern here: assume logged-out immediately, subscribe to `authState` for updates, and only gate `loading` on the categories fetch.

## Context

- `frontend/assets/js/components/elements/Header.jsx` renders `HeaderHelper.renderLoading()` while `loading` is `true`.
- `frontend/assets/js/components/elements/controllers/HeaderController.js#reload()` sets `loading=true`, then `#loadHeaderData()` runs `Promise.all([#checkLogin(), #fetchCategories()])` and only sets `loading=false` in the shared `.finally()` — so the menu blocks on whichever request is slower, including the login check.
- `frontend/assets/js/utils/authState.js` already exposes `isLoggedIn()` (synchronous, defaults to `false`) and `subscribe(listener)`, and is already used this way by page controllers like `CategoriesController.js` (`buildEffect()` calls `safeSet(this.setLogged, isLoggedIn())` then `subscribe(...)`, decoupled from the page's own data loading).
- `HeaderController` does not currently use `isLoggedIn()`/`subscribe()` to seed/update `logged` — it only calls `setLoggedIn(logged)` after `#checkLogin()` resolves, and feeds the result into local React state via `safeSet(this.setLogged, logged)` rather than rendering immediately.

## Implementation Steps

### Step 1 — Seed `logged` from `authState` and subscribe to changes

In `HeaderController`, mirror the `CategoriesController` pattern:
- In `buildEffect()`, immediately `safeSet(this.setLogged, isLoggedIn())` and `subscribe((logged) => safeSet(this.setLogged, logged))`, storing the `unsubscribe` and calling it in the effect's cleanup.
- Import `isLoggedIn` and `subscribe` from `../../../utils/authState.js` (alongside the existing `setLoggedIn` import).

### Step 2 — Decouple `loading` from the login check

- Change `#loadHeaderData()` to only await `#fetchCategories()` for the `loading` flag; `#checkLogin()` should run independently and update `authState`/`setLogged` whenever it resolves, without blocking `setLoading(false)`.
- Keep `#checkLogin()`'s body (`#parseLoginResponse`, `#setLoggedFromSession`) as-is — it still calls `setLoggedIn(logged)`, which now drives the header via the Step 1 subscription instead of (or in addition to) the direct `safeSet(this.setLogged, logged)`. Errors from `#checkLogin()` should not surface as a fatal header error (the page should still work assuming logged-out), so catch them locally instead of letting them propagate into the categories error path.
- `reload()` should still set `loading=true` at the start (categories are genuinely needed to render the menu), but `loading=false` should be set once `#fetchCategories()` settles, not once both requests settle.

### Step 3 — Verify `Header.jsx` needs no changes

`Header.jsx` itself just renders based on `logged`/`categories`/`loading`/`error` state — no changes expected there once the controller seeds `logged` synchronously and decouples loading. Confirm after the controller change that the loading flicker only reflects the categories fetch.

### Step 4 — Update/extend specs

`frontend/spec/.../HeaderController_spec.js` (or equivalent) likely currently asserts `loading` stays `true` until both login and categories resolve — update those expectations to match `CategoryItemController_spec.js`'s already-updated pattern (see commit `a84a005`): `loading` becomes `false` once categories resolve regardless of login timing, `logged` starts from `isLoggedIn()` and updates via the `authState` subscription/event independently.

## Files to Change

- `frontend/assets/js/components/elements/controllers/HeaderController.js` — seed `logged` from `isLoggedIn()`, subscribe to `authState`, decouple `loading` from the login check, unsubscribe on cleanup.
- `frontend/spec/assets/js/components/elements/controllers/HeaderController_spec.js` (path may differ slightly — locate via existing spec conventions) — update expectations for the new decoupled loading/login behavior.

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Follow the exact pattern already established by `CategoriesController.js` / `BasePageController.js` for consistency, rather than inventing a new approach.
- No backend changes are required — this is purely a frontend timing/state-management fix.

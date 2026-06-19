# Plan: Don't wait login for loading

Issue: [207-don-t-wait-login-for-loading.md](../../issues/207-don-t-wait-login-for-loading.md)

## Overview

Decouple page content loading from each page controller's own `GET /users/login.json` call. `Header` already owns the canonical login check and stores the result in `frontend/assets/js/utils/authState.js`. We extend `authState.js` into a small pub/sub store (current value + `subscribe`/notify), have `HeaderController` publish into it once its login check resolves, and have every page controller read the current value synchronously (no fetch, no blocking) and subscribe for late updates instead of independently re-fetching `/users/login.json`.

## Context

- `Header` (`components/elements/Header.jsx` → `HeaderController.js`) already calls `GET /users/login.json` via `HeaderClient.checkLogin()` and pushes the boolean result into the global `authState` module (`setLoggedIn`).
- Every page controller extending `BasePageController` (`CategoriesController`, `CategoryController`, `CategoryItemController`, `CategoryItemsController`, `KindsController`) calls `Promise.all([fetchData(), this.checkLogin()])`, where `BasePageController#checkLogin()` issues its own redundant `GET /users/login.json` and blocks the page's loading state until it resolves.
- `authState.js` currently only exposes `setLoggedIn`/`isLoggedIn` — no way for a page to be notified when the value changes after the page has already rendered.

## Implementation Steps

### Step 1 — Turn `authState.js` into a pub/sub store

Add a `subscribe(callback)` function to `frontend/assets/js/utils/authState.js` that registers a listener and returns an unsubscribe function. `setLoggedIn(value)` should notify all subscribers with the new value whenever it actually changes (skip notifying if the value is unchanged, to avoid redundant re-renders).

### Step 2 — Remove the redundant login fetch from page controllers

Remove `checkLogin()`/`handleLoginResponse()` from `BasePageController` (no other controller needs to issue the HTTP request anymore). Each page controller (`CategoriesController`, `CategoryController`, `CategoryItemController`, `CategoryItemsController`, `KindsController`):

- Drops `checkLogin()` from its `Promise.all([...])` — `#loadData`/equivalent now only waits on its own data fetch(es), so `setLoading(false)` no longer depends on the login check.
- Initializes its `logged` state from `isLoggedIn()` (the current synchronous value, default `false` before the first check ever resolves) instead of `false`.
- Subscribes to `authState.subscribe()` in `buildEffect()` so `setLogged` updates live if the login check resolves after the page has already rendered, or the user logs in/out via the header modal. Unsubscribes in the effect's cleanup function (alongside the existing `mounted = false`).

### Step 3 — Verify `Header` is unaffected

`Header`/`HeaderController` keep fetching `/users/login.json` exactly as today — they are the sole source of truth that publishes into `authState`. No behavior change expected here beyond the publish already happening via `setLoggedIn`.

### Step 4 — Update specs

- `BasePageController` spec: remove coverage of the now-deleted `checkLogin()`/`handleLoginResponse()`.
- Each affected page controller spec: assert the controller no longer issues a login HTTP call, that `setLoading(false)` fires as soon as the page's own data resolves (independent of login), that `setLogged` is seeded from `isLoggedIn()`, and that it updates when `authState` notifies a change.
- `authState` spec (new or extended): cover `subscribe`/unsubscribe and that `setLoggedIn` only notifies on an actual value change.

## Files to Change

- `frontend/assets/js/utils/authState.js` — add `subscribe`, notify-on-change in `setLoggedIn`.
- `frontend/assets/js/components/pages/controllers/BasePageController.js` — remove `checkLogin()`/`handleLoginResponse()`.
- `frontend/assets/js/components/pages/controllers/CategoriesController.js` — drop login from `Promise.all`, seed/subscribe via `authState`.
- `frontend/assets/js/components/pages/controllers/CategoryController.js` — same.
- `frontend/assets/js/components/pages/controllers/CategoryItemController.js` — same.
- `frontend/assets/js/components/pages/controllers/CategoryItemsController.js` — same.
- `frontend/assets/js/components/pages/controllers/KindsController.js` — same.
- Corresponding spec files under `frontend/spec/` mirroring each of the above.

## CI Checks

- `frontend`: `docker-compose run --rm oak_fe npm test` (CI job: `fe_test`)
- `frontend`: `docker-compose run --rm oak_fe npm run lint` (CI job: `fe_lint`)

## Notes

- `authState` is a module-level singleton (not React state), so "subscribe" is a plain callback list, not a context/provider — keeps the change minimal and consistent with the existing pattern.
- No backend changes are needed; `/users/login.json` itself is untouched.
- If the login check ends up flipping `logged` to `true` after a page already rendered as logged-out, the page will reactively update (e.g. show edit controls) — this matches the issue's expected behavior of "reload content in case the user is logged" without an extra fetch.

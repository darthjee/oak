# Frontend Plan: Empty private method #ignoreError in HeaderController (ESLint no-empty-function)

Main plan: [plan.md](plan.md)

## Overview
Codacy flags `#ignoreError() {}` in `HeaderController` with ESLint `@typescript-eslint/no-empty-function`. Swallowing the error is intentional, so the fix is to say so in the method body. Runtime behavior stays the same.

## Context
- `#checkLogin` calls `.catch(this.#ignoreError)`.
- `#parseLoginResponse` already treats 401/403/404 as logged out (it returns `null`, and `#setLoggedFromSession` then sets `false`).
- So the catch only fires for network errors, 5xx responses, and bad JSON. In those cases the login state is unknown: the header keeps the cached `isLoggedIn()` state and shows no error.
- We chose not to replace the catch with `#setLoggedFromSession(safeSet, null)`. That would call `setLoggedIn(false)` in the shared `authState` and log the whole UI out on a transient failure, which is a behavior change.

## Implementation Steps

### Step 1 — Document intent inside `#ignoreError`
In `HeaderController.js`, replace `#ignoreError() {}` with a body that has only an explanatory comment:

```js
#ignoreError() {
  // Login check failures (network, 5xx, bad JSON) are non-fatal:
  // keep the cached logged state and do not surface a header error.
}
```

Leave `.catch(this.#ignoreError)` in `#checkLogin` as it is. The rule accepts a function whose body contains a comment. No JSDoc is required, because the other private `#` methods in this file don't carry one either. Confirm with `npm run lint`.

### Step 2 — (Optional) Lock in current behavior in the spec
In `HeaderController_spec.js`, the case `does not surface a login check failure as a header error` already covers the rejection path. Optionally, add an assertion that `setLogged` is not called with `false` after the rejection, e.g. `expect(setLogged).not.toHaveBeenCalledWith(false)`. Check how `isLoggedIn()` / `authState` are set up in the spec first, so the initial `safeSet(this.setLogged, isLoggedIn())` call can't produce a false positive. If it can, reset `authState` to logged-in first, or assert on the calls made after mount.

## Files to Change
- `frontend/assets/js/components/elements/controllers/HeaderController.js` — add the explanatory comment to the body of `#ignoreError`.
- `frontend/spec/components/elements/controllers/HeaderController_spec.js` — (optional) extra assertion on the failure path.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` / `npm test` (CI job: `jasmine`)

## Notes
- No behavior change is intended. If a reviewer wants "unknown means logged out" or a "couldn't verify" state, that belongs in a separate issue.

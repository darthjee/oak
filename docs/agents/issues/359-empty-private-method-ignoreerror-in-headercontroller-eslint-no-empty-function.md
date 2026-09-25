# Issue: Empty private method #ignoreError in HeaderController (ESLint no-empty-function)

## Description
Codacy reports an ESLint `@typescript-eslint/no-empty-function` warning (BestPractice, Warning) on `frontend/assets/js/components/elements/controllers/HeaderController.js:92`: *Unexpected empty private method #ignoreError* (`#ignoreError() {}`).
https://app.codacy.com/p/681941/issues/index?resultDataId=131541346566

## Problem
`HeaderController#checkLogin` swallows login-check failures with `.catch(this.#ignoreError)`, where `#ignoreError() {}` has an empty body. Swallowing the error is intentional: a failed login check (network error or unexpected status) must not show up as a header error, and the logged-in flag keeps the cached value from `isLoggedIn()` set at mount. But the empty body doesn't say that, so the linter flags it.

## Expected Behavior
- `#ignoreError` explains its intent inside its body, e.g. `// login check failures are non-fatal: keep the cached logged state and do not surface an error`. The rule accepts a comment in the body.
- Runtime behavior does not change. A failed login check still does not call `setError` with a message, and it does not overwrite the cached logged-in state.
- Codacy no longer reports the finding.
- The `frontend` Jasmine specs and ESLint (including the JSDoc rules in `frontend/eslint.config.mjs`) still pass.

## Solution
- Put an explanatory comment in the body of `#ignoreError` in `HeaderController.js`. Leave `.catch(this.#ignoreError)` in `#checkLogin` as it is.
- Do **not** switch to `.catch(() => this.#setLoggedFromSession(safeSet, null))`. That would force the user to logged-out on any transient failure, which is a behavior change.
- `HeaderController_spec.js` already covers the failure path (`does not surface a login check failure as a header error`). Optionally, strengthen it to assert that `setLogged` is not called with `false` after the rejection.
- Owner: `frontend` agent.

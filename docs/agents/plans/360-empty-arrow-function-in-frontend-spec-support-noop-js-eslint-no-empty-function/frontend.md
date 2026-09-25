# Frontend Plan: Empty arrow function in frontend/spec/support/noop.js (ESLint no-empty-function)

Main plan: [plan.md](plan.md)

## Overview
Silence Codacy's `@typescript-eslint/no-empty-function` finding on `frontend/spec/support/noop.js:1` by documenting the intentional empty body, mirroring the fix applied to `HeaderController#ignoreError` in #359.

## Context
`export const noop = () => {};` is imported by ~16 specs as a stand-in for callback props. The flagged rule is not part of `frontend/eslint.config.mjs` (Codacy uses its own ruleset), so the fix must be in the source, not the repo ESLint config. `no-empty-function` accepts function bodies that contain a comment.

## Implementation Steps

### Step 1 — Document the intentional empty body
Replace the one-liner in `frontend/spec/support/noop.js` with:

```js
export const noop = () => {
  // Intentionally empty: stand-in for callback props that specs do not exercise.
};
```

Keep the export name and signature unchanged; do not touch any spec that imports `noop`, and do not change `frontend/eslint.config.mjs`.

## Files to Change
- `frontend/spec/support/noop.js` — add explanatory comment inside the arrow function body.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`)

## Notes
- No behaviour change: `noop` still returns `undefined`.
- Codacy resolution can only be confirmed after the PR is analysed.

# Issue: Empty arrow function in frontend/spec/support/noop.js (ESLint no-empty-function)

## Description
Codacy reports `frontend/spec/support/noop.js:1` under ESLint `@typescript-eslint/no-empty-function` (BestPractice, Warning): *Unexpected empty arrow function.*

```js
export const noop = () => {};
```

https://app.codacy.com/p/681941/issues/index?resultDataId=131541346567

## Problem
`noop` is a deliberate no-op helper imported by ~16 frontend specs (e.g. `CategoryKindBadge_spec.js`, `CollectionSelect_spec.js`, `CategoryItemNew_spec.js`) to satisfy callback props. Codacy's ESLint rule flags it anyway. The rule is not part of `frontend/eslint.config.mjs` (no typescript-eslint plugin there), so Codacy is using its own ruleset — disabling the rule in the repo config for `spec/**` would not clear the finding.

## Expected Behavior
- Codacy no longer reports the finding above.
- `frontend` Jasmine specs and ESLint still pass.
- No behaviour change: `noop` still returns `undefined` and specs keep importing it exactly as today.

## Solution
Put an explanatory comment inside the arrow function body, which `no-empty-function` accepts — the same approach used for `HeaderController#ignoreError` in #359:

```js
export const noop = () => {
  // Intentionally empty: stand-in for callback props that specs do not exercise.
};
```

Do not change `frontend/eslint.config.mjs` and do not touch any spec that imports `noop`.

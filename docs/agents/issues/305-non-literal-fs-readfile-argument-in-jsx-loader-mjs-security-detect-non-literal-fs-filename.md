# Issue: Non-literal fs readFile argument in jsx-loader.mjs (security/detect-non-literal-fs-filename)

## Description
Codacy flags a High-priority, overdue Security finding in `frontend/spec/support/jsx-loader.mjs:52`:

```js
const source = await readFile(new URL(url), 'utf8');
```

Pattern: `ESLint8_security_detect-non-literal-fs-filename` (category Security/FileAccess). `readFile` is called with a `URL` built from an argument that static analysis can't prove is a literal path.

Codacy finding: https://app.codacy.com/p/681941/issues/index?resultDataId=131495661442

## Problem
`jsx-loader.mjs` is a Node.js ESM loader hook, registered only via `NODE_OPTIONS='--loader ./spec/support/jsx-loader.mjs'` in `frontend/package.json`'s `test` and `coverage` scripts (Jasmine test runs).

The `url` argument to `load(url, context, defaultLoad)` is supplied by Node's own ESM loader chain — it is either produced by this same file's `resolve()` hook (which only builds `.jsx`/`.js` candidate URLs from statically-declared relative import specifiers, verified with `existsSync` before use) or by Node's default resolver acting on the test suite's own static `import` statements. There is no code path by which external, user-supplied, or otherwise attacker-controlled input reaches `url`. This is a false positive, not a real path-traversal risk.

## Expected Behavior
The `readFile(new URL(url), 'utf8')` call keeps its current behavior; the line no longer appears as an overdue Codacy security finding.

## Solution
Add a narrowly-scoped, justified suppression on the flagged line:

```js
// eslint-disable-next-line security/detect-non-literal-fs-filename -- url originates from this loader's own resolve() hook or Node's static import resolution during test runs; never derived from external/user input
const source = await readFile(new URL(url), 'utf8');
```

This mirrors the precedent set in `frontend/assets/js/utils/Route.js:30` for #282's `security-node/non-literal-reg-expr` suppression: a targeted disable comment with an inline justification, rather than adding validation for an input that can never be attacker-controlled.

## Benefits
- Resolves the overdue Codacy security finding.
- No behavior change and no unnecessary validation logic added for a value that is always developer/toolchain-controlled.
- Keeps the suppression narrowly scoped and documented, consistent with this repo's existing pattern for justified security-lint exceptions.

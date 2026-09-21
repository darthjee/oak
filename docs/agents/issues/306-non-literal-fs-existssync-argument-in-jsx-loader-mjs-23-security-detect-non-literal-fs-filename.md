# Issue: Non-literal fs existsSync argument in jsx-loader.mjs:23 (security/detect-non-literal-fs-filename)

## Problem
Codacy flags a Security finding (High priority, Overdue) in
`frontend/spec/support/jsx-loader.mjs:23`:

```js
if (existsSync(fileURLToPath(candidate))) {
```

Pattern: `ESLint8_security_detect-non-literal-fs-filename` (category
Security/FileAccess). `existsSync` is called with a non-literal path argument.

`candidate` is built in `resolve()` from `specifier` (a relative import string
from source code) and `context.parentURL`, with a `.jsx`/`.js` suffix appended —
it never comes from external/user input, only from local module resolution during
the test run. This is the same shape of false positive as the sibling
`readFile` call at line 53 of the same file, already fixed under #305 (PR #316).

Codacy finding: https://app.codacy.com/p/681941/issues/index?resultDataId=131496077051

## Solution
Add a narrowly-scoped, justified
`eslint-disable-next-line security/detect-non-literal-fs-filename` comment directly
above the `if (existsSync(fileURLToPath(candidate)))` line, matching the comment
already added above the `readFile` call in the same file under #305:

```js
// eslint-disable-next-line security/detect-non-literal-fs-filename -- candidate originates from this loader's own resolve() hook (relative specifier + parentURL), never from external/user input
if (existsSync(fileURLToPath(candidate))) {
```

No changes to `frontend/eslint.config.mjs` are needed — the inert rule stub for
`spec/support/jsx-loader.mjs` added under #305 already registers
`security/detect-non-literal-fs-filename` for the whole file, so this new
disable directive will resolve locally without further config changes.

## Benefits
Clears the overdue Codacy security finding while keeping the suppression
narrowly scoped and documented, consistent with how the sibling `readFile`
false positive was already handled in the same file.

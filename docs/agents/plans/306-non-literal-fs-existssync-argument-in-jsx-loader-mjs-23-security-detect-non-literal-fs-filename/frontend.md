# Frontend Plan: Non-literal fs existsSync argument in jsx-loader.mjs:23 (security/detect-non-literal-fs-filename)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Suppress the false-positive existsSync finding
In `frontend/spec/support/jsx-loader.mjs`, `resolve()` builds `candidate` from
`specifier` (a relative import string from source code, guarded by the
`specifier.startsWith('.')` check above) and `context.parentURL`, appending a
`.jsx`/`.js` suffix — never external/user input. Add a narrowly-scoped,
justified `eslint-disable-next-line security/detect-non-literal-fs-filename`
comment directly above the `if (existsSync(fileURLToPath(candidate)))` line
(line 23), matching the comment already added above the `readFile` call
further down in the same file under #305 (PR #316):

```js
// eslint-disable-next-line security/detect-non-literal-fs-filename -- candidate originates from this loader's own resolve() hook (relative specifier + parentURL), never from external/user input
if (existsSync(fileURLToPath(candidate))) {
```

No change to `frontend/eslint.config.mjs` is needed: the inert rule stub for
`spec/support/jsx-loader.mjs` added under #305 (`files: ['spec/support/jsx-loader.mjs']`,
registering `security/detect-non-literal-fs-filename`) already applies to the
whole file, not just the `readFile` line, so this new disable directive will
resolve locally without further config changes.

## Files to Change
- `frontend/spec/support/jsx-loader.mjs` — add the justified eslint-disable comment above line 23

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)
- `frontend`: `npm run coverage` (CI job: `jasmine`) — exercises the loader itself, so it's worth a smoke check even though this change only adds a comment

## Notes
- Purely a lint-suppression change (with justification comment); no runtime behavior changes.

# Frontend Plan: Non-literal fs readFile argument in jsx-loader.mjs (security/detect-non-literal-fs-filename)

Main plan: [plan.md](plan.md)

## Overview
Codacy flags `frontend/spec/support/jsx-loader.mjs:52` (`readFile(new URL(url), 'utf8')`) as a High-priority Security/FileAccess finding (`security/detect-non-literal-fs-filename`) because static analysis can't prove `url` is a literal path.

## Context
`jsx-loader.mjs` is a Node ESM `--loader` hook, wired in only via `NODE_OPTIONS='--loader ./spec/support/jsx-loader.mjs'` in `frontend/package.json`'s `test` and `coverage` scripts. The `url` argument to `load(url, context, defaultLoad)` always comes from Node's own ESM loader chain — either this same file's `resolve()` hook (which only builds `.jsx`/`.js` candidate URLs from statically-declared relative import specifiers, checked with `existsSync`) or Node's default resolver acting on the test suite's own static `import` statements. There is no path for external/attacker-controlled input to reach it, so this is a false positive, not a real path-traversal risk.

Note for implementation: the repo's local `frontend/eslint.config.mjs` only registers `eslint-plugin-security-node`'s `security-node/non-literal-reg-expr` rule — it does not register `eslint-plugin-security`'s `security/detect-non-literal-fs-filename` rule at all (that's a Codacy-hosted analysis, run independently of `npm run lint`). So `npm run lint` will not fail or pass judgment on this rule either way; do not add the `eslint-plugin-security` plugin/rule to the local config as part of this fix — the suppression comment only needs to satisfy Codacy's hosted analysis, exactly like the existing `security-node/non-literal-reg-expr` suppression in `frontend/assets/js/utils/Route.js:30` (added for issue #282) does for its own rule.

## Implementation Steps

### Step 1 — Add a justified suppression comment
Add a single-line `eslint-disable-next-line security/detect-non-literal-fs-filename` comment directly above the flagged `readFile` call in `frontend/spec/support/jsx-loader.mjs`, with an inline justification (`-- ...`) explaining that `url` originates from this loader's own `resolve()` hook or Node's static import resolution during test runs, and is never derived from external/user input — same comment style as `frontend/assets/js/utils/Route.js:30`.

## Files to Change
- `frontend/spec/support/jsx-loader.mjs` — add the `eslint-disable-next-line security/detect-non-literal-fs-filename` justification comment above line 52 (`const source = await readFile(new URL(url), 'utf8');`); no behavior change.

## CI Checks
- `frontend`: `npm run coverage` (CI job: `jasmine`) — the loader is exercised by every Jasmine test run; confirm the full suite still passes unchanged.
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — expected to pass unchanged (the disabled rule isn't registered locally, so this is a no-op for local lint, only relevant to Codacy's hosted analysis).

## Notes
- This is a suppression of a false positive, not a functional fix — no test changes are needed since behavior is unchanged.
- The fix cannot be verified against the actual `security/detect-non-literal-fs-filename` rule locally since it isn't part of `frontend/eslint.config.mjs`; verification of the Codacy finding itself only happens after the next Codacy analysis run on the PR.

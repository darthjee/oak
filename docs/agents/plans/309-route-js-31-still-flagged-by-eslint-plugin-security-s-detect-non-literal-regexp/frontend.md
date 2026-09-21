# Frontend Plan: Route.js:31 still flagged by eslint-plugin-security's detect-non-literal-regexp

Main plan: [plan.md](plan.md)

## Shared contracts

None — this is a single-agent, single-file-area change confined to `frontend/`.

## Implementation Steps

### Step 1 — Extend the inert security-rule stub to cover `detect-non-literal-regexp` and `Route.js`
In `frontend/eslint.config.mjs`, find the last config block — the one whose comment explains `eslint-plugin-security` isn't installed locally and stubs `detect-non-literal-fs-filename` for `spec/support/jsx-loader.mjs` and `spec/components/index_html_spec.js`. Extend it:
- Add `'assets/js/utils/Route.js'` to the block's `files` array.
- Add a `'detect-non-literal-regexp': { create: () => ({}) }` entry alongside the existing `'detect-non-literal-fs-filename'` entry inside `plugins.security.rules`.
- Update the block's explanatory comment to also mention `Route.js` and the `detect-non-literal-regexp` rule, so the comment still accurately describes what the stub covers and why.

### Step 2 — Add the justified disable comment on Route.js:31
In `frontend/assets/js/utils/Route.js`, directly above (or alongside, matching the existing style) the current `// eslint-disable-next-line security-node/non-literal-reg-expr -- ...` comment on the `this.#regex = new RegExp(...)` line, add:
```js
// eslint-disable-next-line security/detect-non-literal-regexp -- pattern is always a static, developer-authored route definition (see HashRouteResolver.js); never derived from user input
```
Reuse the exact justification already established in #282/#293 — `pattern` is always a static, developer-authored route definition (traced through `Router.js` → `HashRouteResolver.js`), never derived from user/URL input, so there is no actual ReDoS risk. Keep both disable comments on/around the same line, following whatever ordering reads most naturally with the existing one.

## Files to Change
- `frontend/eslint.config.mjs` — extend the existing inert `security` plugin stub's `files` array and `rules` map to also cover `Route.js` and `detect-non-literal-regexp`; update its explanatory comment accordingly.
- `frontend/assets/js/utils/Route.js` — add a justified `eslint-disable-next-line security/detect-non-literal-regexp` comment on line 31, alongside the existing `security-node/non-literal-reg-expr` disable comment.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`) — confirms both disable comments resolve locally (no "Definition for rule ... was not found" error) and no new lint errors are introduced.
- `frontend`: `npm run coverage` (CI job: `jasmine`) — confirms the existing Route.js test suite still passes unchanged, since this is a lint-only/comment-only change with no behavioral modification.

## Notes
- No new dependency is installed — `eslint-plugin-security` stays hosted-only via Codacy, matching the pattern already used for `detect-non-literal-fs-filename`.
- This does not change `Route.js`'s runtime behavior at all; only comments and lint config are touched.

# Issue: Route.js:31 still flagged by eslint-plugin-security's detect-non-literal-regexp

## Problem
Codacy still flags a High-priority, Overdue Security/DoS finding on `frontend/assets/js/utils/Route.js:31`:

```js
this.#regex = new RegExp(`^${pattern}/?$`);
```

under `eslint-plugin-security`'s `detect-non-literal-regexp` rule
(https://app.codacy.com/p/681941/issues/index?resultDataId=131497547016).

#282 / PR #293 already suppressed a *different* rule on this same line —
`security-node/non-literal-reg-expr` from `eslint-plugin-security-node`,
which is registered in `frontend/eslint.config.mjs`. Codacy's hosted scan
separately runs `eslint-plugin-security`, which is not installed or
registered locally, so its `detect-non-literal-regexp` finding on this line
was never suppressed and stays open.

## Solution
Reuse the existing inert-stub pattern already established in
`frontend/eslint.config.mjs` for this exact situation (added by #305/#306/#307
for `detect-non-literal-fs-filename`), rather than actually installing
`eslint-plugin-security` as a dependency:

1. Extend the stub block's `files` array to also include
   `assets/js/utils/Route.js`, and its `security.rules` stub object to also
   register `detect-non-literal-regexp` (alongside the existing
   `detect-non-literal-fs-filename` entry) as a no-op rule, so ESLint
   recognizes the rule name locally without the plugin actually running.
2. Update the block's explanatory comment to mention Route.js and the new
   rule.
3. Add `// eslint-disable-next-line security/detect-non-literal-regexp -- ...`
   directly alongside the existing
   `security-node/non-literal-reg-expr` disable comment on
   `Route.js:31`, reusing the justification already established in #282:
   `pattern` is always a static, developer-authored route definition (traced
   through `Router.js` → `HashRouteResolver.js`), never derived from
   user/URL input, so there's no actual ReDoS risk.

## Benefits
- Closes the open Codacy Security/DoS finding on `Route.js:31` without
  weakening any actual protection, since the underlying risk was already
  ruled out in #282.
- Local `eslint` runs recognize and resolve the justified disable comment
  (avoiding a "Definition for rule ... was not found" lint error) the same
  way jsx-loader.mjs and index_html_spec.js already do.
- Keeps a single, consistent suppression pattern for Codacy-only
  `eslint-plugin-security` rules across the codebase, instead of introducing
  a second approach (e.g. actually installing the plugin) for this one case.

## Source
Detected by Codacy static analysis (ESLint `eslint-plugin-security`,
rule `detect-non-literal-regexp`). Related: #282, #293, #305, #306, #307.

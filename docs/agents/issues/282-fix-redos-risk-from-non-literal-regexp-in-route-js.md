# Issue: Fix ReDoS risk from non-literal RegExp in Route.js

## Description
Codacy flags `frontend/assets/js/utils/Route.js:30` (ESLint `security-node/non-literal-reg-expr`, category Security/DoS, severity Error — the single highest-severity finding in the repo):

```js
this.#regex = new RegExp(`^${pattern}/?$`);
```

Building a `RegExp` from a non-literal, interpolated pattern can lead to a ReDoS (catastrophic backtracking) if `pattern` ever comes from untrusted input.

## Problem
`pattern` is derived from the `path` argument passed to `Route`'s constructor, with `:param` segments replaced by `([^/]+)`. Tracing every current call site (`Router.js` → `HashRouteResolver.js`) confirms `path` is always a static, developer-authored string literal (e.g. `/categories/:slug/items/:id`) — never derived from user input, query strings, or the URL hash being resolved. The generated regex fragments are simple, non-nested, and cannot backtrack catastrophically.

The Codacy rule cannot verify this statically since `new RegExp()` is called with a template-interpolated string rather than a literal, so it flags the call regardless of where `pattern` actually comes from.

## Solution
Since `pattern` is always static and developer-authored today, suppress the rule at the call site in `frontend/assets/js/utils/Route.js` with an ESLint disable comment explaining why it's safe (all callers pass static route definitions; see `HashRouteResolver.js`), rather than adding runtime validation/sanitization that isn't needed for the current usage.

If Route.js starts accepting dynamic/user-supplied patterns in the future, this suppression should be revisited.

## Benefits
Resolves the single highest-severity Codacy finding in the repo and documents, for future maintainers, why the non-literal `RegExp` construction here is safe.

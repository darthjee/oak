# Frontend Plan: Fix ReDoS risk from non-literal RegExp in Route.js

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Suppress the finding with an explanatory comment
In `frontend/assets/js/utils/Route.js`, add an ESLint disable comment directly above (or on) the `new RegExp(...)` call at line 30, targeting `security-node/non-literal-reg-expr`, with a reason clause explaining that `pattern` always comes from a static, developer-authored route definition (traced through `Router.js` → `HashRouteResolver.js`, none of which pass user/URL-derived input):

```js
// eslint-disable-next-line security-node/non-literal-reg-expr -- pattern is always a static, developer-authored route definition (see HashRouteResolver.js); never derived from user input
this.#regex = new RegExp(`^${pattern}/?$`);
```

No behavior change — this only documents/suppresses the static-analysis finding.

## Files to Change
- `frontend/assets/js/utils/Route.js` — add the `eslint-disable-next-line` comment with justification above the `new RegExp(...)` call (around line 30).

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No new specialist agent ownership needed; this is a single-line, single-file change.
- If `Route.js` is ever changed to accept dynamic/user-supplied patterns, this suppression must be revisited and real validation/sanitization added instead.

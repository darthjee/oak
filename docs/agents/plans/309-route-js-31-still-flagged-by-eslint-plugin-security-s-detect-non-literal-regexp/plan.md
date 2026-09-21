# Plan: Route.js:31 still flagged by eslint-plugin-security's detect-non-literal-regexp

Issue: [309-route-js-31-still-flagged-by-eslint-plugin-security-s-detect-non-literal-regexp.md](../../issues/309-route-js-31-still-flagged-by-eslint-plugin-security-s-detect-non-literal-regexp.md)

## Overview
Codacy still flags `frontend/assets/js/utils/Route.js:31` under `eslint-plugin-security`'s `detect-non-literal-regexp` rule, even though #282/#293 already suppressed the unrelated `security-node/non-literal-reg-expr` rule on the same line. `eslint-plugin-security` isn't installed locally — Codacy runs it hosted-only — so this rule's disable comment was never recognized. The fix extends the existing inert-stub pattern in `frontend/eslint.config.mjs` (established by #305/#306/#307 for `detect-non-literal-fs-filename`) to also cover `detect-non-literal-regexp` and `Route.js`, then adds a justified disable comment reusing #282's rationale.

See [frontend.md](frontend.md) for the full plan.

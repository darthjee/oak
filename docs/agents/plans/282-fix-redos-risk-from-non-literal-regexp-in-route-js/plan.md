# Plan: Fix ReDoS risk from non-literal RegExp in Route.js

Issue: [282-fix-redos-risk-from-non-literal-regexp-in-route-js.md](../../issues/282-fix-redos-risk-from-non-literal-regexp-in-route-js.md)

## Overview
Codacy flags the interpolated `RegExp` construction in `Route.js` as a potential ReDoS vector. Tracing every call site confirms the pattern is always static and developer-authored, so the fix is a documented ESLint suppression at the call site rather than runtime validation.

See [frontend.md](frontend.md) for the full plan.

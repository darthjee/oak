# Issue: Non-literal fs readFileSync argument in index_html_spec.js (security/detect-non-literal-fs-filename)

## Description
Codacy's static analysis (`eslint-plugin-security`, rule `detect-non-literal-fs-filename`) flags a Security finding (High priority, Overdue) in `frontend/spec/components/index_html_spec.js:5`, where `readFileSync` is called with a path built from `new URL('../../index.html', import.meta.url)`. The path segment is a literal string, but ESLint's static analysis can't resolve `new URL(literal, import.meta.url)` down to a literal path, so this is almost certainly a false positive — the same situation already suppressed for `frontend/spec/support/jsx-loader.mjs` under #305.

## Problem
```js
const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
```

Pattern: `ESLint8_security_detect-non-literal-fs-filename` (category Security/FileAccess).

Codacy finding: https://app.codacy.com/p/681941/issues/index?resultDataId=131497541815

Only this line (5) is flagged by Codacy. The file's other call with the same literal-URL construction — `existsSync(new URL('../../assets/images/favicon.png', import.meta.url))` on line 8 — is not flagged and is out of scope for this fix.

## Solution
Add a narrowly-scoped, justified `eslint-disable-next-line security/detect-non-literal-fs-filename` comment directly above the flagged `readFileSync` call, explaining why the path is safe.

Reuse the precedent already established for this exact rule in `frontend/spec/support/jsx-loader.mjs` (#305): `eslint-plugin-security` itself isn't installed locally (Codacy runs it independently), so an inert local stub plugin is registered in `frontend/eslint.config.mjs`, scoped via a `files` glob, purely so the disable comment resolves locally instead of failing lint with an unknown-rule error. Widen that existing stub block's `files` glob to also match `spec/components/index_html_spec.js`, rather than installing the real `eslint-plugin-security` package or adding a second stub block.

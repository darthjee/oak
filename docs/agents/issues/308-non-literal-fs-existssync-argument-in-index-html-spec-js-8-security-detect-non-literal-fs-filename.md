# Issue: Non-literal fs existsSync argument in index_html_spec.js:8 (security/detect-non-literal-fs-filename)

## Problem
Codacy flags a Security finding (High priority, Overdue) in `frontend/spec/components/index_html_spec.js`, on the `existsSync` call:

```js
expect(existsSync(new URL('../../assets/images/favicon.png', import.meta.url))).toBeTrue();
```

Pattern: `ESLint8_security_detect-non-literal-fs-filename` (category Security/FileAccess).

Codacy finding: https://app.codacy.com/p/681941/issues/index?resultDataId=131497541814

This is the sibling of #305/#306, which fixed the same rule on the `readFileSync` call earlier in the same spec file. That fix already landed (see the `eslint-disable-next-line` comment above the `readFileSync` line in `frontend/spec/components/index_html_spec.js`) — the `existsSync` call below it still triggers the rule and needs the equivalent treatment.

## Solution
Add a narrowly-scoped `eslint-disable-next-line security/detect-non-literal-fs-filename` comment directly above the `existsSync` call, explaining why the path is safe — mirroring the justification already used for the `readFileSync` line just above it in the same file (a literal, `import.meta.url`-relative string that ESLint's static analysis can't resolve through `new URL(literal, import.meta.url)`, never derived from external/user input).

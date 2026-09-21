# Frontend Plan: Non-literal fs readFileSync argument in index_html_spec.js (security/detect-non-literal-fs-filename)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Widen the existing inert ESLint stub to cover the new file
`frontend/eslint.config.mjs` already registers an inert local stub for the `security/detect-non-literal-fs-filename` rule (added under #305), scoped via a `files` glob to `spec/support/jsx-loader.mjs`, purely so a justified `eslint-disable-next-line` comment for that unrecognized rule resolves locally instead of failing lint (`eslint-plugin-security` itself isn't installed — Codacy runs it independently). Widen that block's `files` glob to also match `spec/components/index_html_spec.js`, e.g. `files: ['spec/support/jsx-loader.mjs', 'spec/components/index_html_spec.js']`. Keep the existing explanatory comment above the block accurate for both files.

### Step 2 — Suppress the flagged line
In `frontend/spec/components/index_html_spec.js`, add `// eslint-disable-next-line security/detect-non-literal-fs-filename -- <reason>` directly above the `readFileSync(new URL('../../index.html', import.meta.url), 'utf8')` call (currently line 5), with a justification matching the style already used in `jsx-loader.mjs`: the path is a literal, `import.meta.url`-relative string that ESLint's static analysis can't resolve through `new URL(literal, import.meta.url)`, never derived from external/user input.

Do not touch the `existsSync(new URL('../../assets/images/favicon.png', import.meta.url))` call on line 8 — it isn't flagged by Codacy and is out of scope for this fix (per the issue's explicit scope decision).

## Files to Change
- `frontend/eslint.config.mjs` — widen the existing inert stub block's `files` glob to also match `spec/components/index_html_spec.js`.
- `frontend/spec/components/index_html_spec.js` — add the justified `eslint-disable-next-line security/detect-non-literal-fs-filename` comment above the flagged `readFileSync` call.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No real `eslint-plugin-security` install — this stays consistent with the #305 precedent of an inert local stub, not a functioning rule implementation.
- No runtime behavior change; test coverage for this spec is unaffected.

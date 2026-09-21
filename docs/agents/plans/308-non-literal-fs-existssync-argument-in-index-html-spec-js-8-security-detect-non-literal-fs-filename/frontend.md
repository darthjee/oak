# Frontend Plan: Non-literal fs existsSync argument in index_html_spec.js:8 (security/detect-non-literal-fs-filename)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Suppress the false-positive finding on the `existsSync` call
In `frontend/spec/components/index_html_spec.js`, add a narrowly-scoped
`eslint-disable-next-line security/detect-non-literal-fs-filename` comment
directly above the `existsSync` call, with a justification matching the one
already used above the `readFileSync` call in the same file: the path is a
literal, `import.meta.url`-relative string that ESLint's static analysis
can't resolve through `new URL(literal, import.meta.url)`, and is never
derived from external/user input.

## Files to Change
- `frontend/spec/components/index_html_spec.js` — add the `eslint-disable-next-line security/detect-non-literal-fs-filename` comment above the `existsSync(...)` call inside the `it` block.

## CI Checks
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes
- No behavior change; this only suppresses a static-analysis false positive, matching the pattern already merged for the sibling `readFileSync` line (#305/#306).

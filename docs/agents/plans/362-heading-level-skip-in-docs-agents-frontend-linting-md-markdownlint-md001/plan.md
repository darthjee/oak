# Plan: Heading level skip in docs/agents/frontend/linting.md (markdownlint MD001)

Issue: [362-heading-level-skip-in-docs-agents-frontend-linting-md-markdownlint-md001.md](../../issues/362-heading-level-skip-in-docs-agents-frontend-linting-md-markdownlint-md001.md)

## Overview

Fix the markdownlint MD001 (heading increment) finding reported by Codacy on `docs/agents/frontend/linting.md:14` by inserting a `## JSDoc` h2 section that groups the existing `### Convention` and `### Example` subsections. Documentation-only change, owned by the architect (`docs/agents/` scope).

## Context

The file goes from `# Linting and Inline Documentation` (line 1) directly to `### Convention` (line 14) and `### Example` (line 22). Both h3 sections detail the JSDoc rules introduced by the paragraph on line 12 ("All public classes, methods, and exported functions in `frontend/assets/js/` should include JSDoc comments."), but no h2 heading groups them.

No Markdown file links to heading anchors in `linting.md` (grep for `linting.md#` returns nothing), and the `#convention` / `#example` anchors are unchanged by this fix.

## Implementation Steps

### Step 1 — Add the `## JSDoc` section heading

In `docs/agents/frontend/linting.md`, insert a `## JSDoc` heading followed by a blank line immediately above the line-12 paragraph, so the structure becomes:

```markdown
# Linting and Inline Documentation

<intro + ESLint bullet list>

## JSDoc

All public classes, methods, and exported functions in `frontend/assets/js/` should include JSDoc comments.

### Convention
...
### Example
...
```

Keep `### Convention` and `### Example` as h3. Leave all other content untouched.

### Step 2 — Verify

Run markdownlint on the file (e.g. `npx markdownlint-cli docs/agents/frontend/linting.md`) and confirm MD001 is no longer reported and no new findings are introduced.

## Files to Change

- `docs/agents/frontend/linting.md` — add `## JSDoc` h2 heading above the JSDoc paragraph (line 12) to fix the h1 → h3 skip.

## Notes

- No CI job runs markdownlint directly; the finding comes from Codacy, which should clear once the change reaches `main`.
- `docs/agents/summary.md` / `docs/agents/frontend/index.md` link to the file itself, not to anchors, so no index updates are needed.

# Issue: Heading level skip in docs/agents/frontend/linting.md (markdownlint MD001)

## Description
Codacy reports a markdownlint MD001 finding (BestPractice, Info) on `docs/agents/frontend/linting.md:14`: *Expected: h2; Actual: h3* for `### Convention`.
https://app.codacy.com/p/681941/issues/index?resultDataId=131525773125

## Problem
The document jumps from the h1 `# Linting and Inline Documentation` directly to `### Convention` (line 14) and `### Example` (line 22), skipping the h2 level. Both h3 sections describe the JSDoc rules introduced by the paragraph on line 12, but there is no h2 section grouping them.

## Expected Behavior
- The heading hierarchy in `docs/agents/frontend/linting.md` increments by one level at a time.
- Codacy / markdownlint no longer reports MD001 for this file.
- The document's content and meaning are unchanged.

## Solution
Add a `## JSDoc` h2 heading immediately above the paragraph on line 12 ("All public classes, methods, and exported functions ... should include JSDoc comments."), keeping `### Convention` and `### Example` as h3 subsections beneath it. This fixes the skip while preserving the existing grouping (ESLint intro → JSDoc section with Convention/Example subsections).

- No other Markdown file links to anchors in `linting.md` (verified via grep for `linting.md#`), and the existing `#convention` / `#example` anchors are unchanged, so no link updates are needed.
- Documentation-only change; no code or behaviour change.

## Benefits
- Resolves the Codacy MD001 finding.
- Clearer document structure for readers and agents navigating the frontend docs.

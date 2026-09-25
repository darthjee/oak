# Plan: Inline HTML-like placeholders in .github/commit_message_template.md (markdownlint MD033)

Issue: [361-inline-html-like-placeholders-in-github-commit-message-template-md-markdownlint-md033.md](../../issues/361-inline-html-like-placeholders-in-github-commit-message-template-md-markdownlint-md033.md)

## Overview

Silence the false-positive markdownlint MD033 findings on the `.github/` literal templates by excluding them from linting, mirroring what arcanum does in its own repo (arcanum #502), instead of editing the template content.

## Context

`.github/commit_message_template.md` uses angle-bracket placeholders (`<type>`, `<scope>`, `<AI model name>`, `<agent>`...) that markdownlint reads as inline HTML. The file is a plain-text template installed by arcanum's `init-claude` (recreated if missing), and its content is never parsed at runtime — oak also has `commit_message_template-2.0.md`, whose mere presence selects the new commit shape. Oak currently has no `.codacy.yml` and no `.markdownlintignore`. Per the issue discussion, all Codacy exclusions for oak live in `.codacy.yml` (the Codacy UI is not used for ignored files).

## Implementation Steps

### Step 1 — Add `.codacy.yml`

Create a root `.codacy.yml` with an `exclude_paths` list containing:

- `.github/commit_message_template.md`
- `.github/commit_message_template-2.0.md`
- `.github/pull_request_template.md`

Precede the list with a comment explaining that these are literal templates whose content is substituted verbatim into commit messages and PR bodies, so markdownlint rules (MD033 inline-HTML placeholders, MD041 first-line heading) don't apply and fixing them would alter generated output. Reference issue #361 and arcanum's equivalent exclusion.

### Step 2 — Add `.markdownlintignore`

Create a root `.markdownlintignore` listing the same three paths, with the same explanatory comment, so local markdownlint runs agree with Codacy.

## Files to Change

- `.codacy.yml` (new) — Codacy `exclude_paths` for the three `.github/` templates
- `.markdownlintignore` (new) — mirror of the exclusion for local markdownlint

## Notes

- Do not modify the template files themselves — their content must stay identical to arcanum's upstream copies.
- No CI job runs markdownlint in oak; verification is that Codacy stops reporting the three MD033 findings on the PR.
- `.codacy.yml` excludes the files from all Codacy tools, which is intended for these non-code templates.
- Owner: `architect` (root-level and `.github/` files; no specialist scope applies).

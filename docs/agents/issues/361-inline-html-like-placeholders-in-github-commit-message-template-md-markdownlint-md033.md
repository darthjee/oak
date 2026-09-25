# Issue: Inline HTML-like placeholders in .github/commit_message_template.md (markdownlint MD033)

## Description
Codacy's markdownlint reports three `MD033` (inline HTML) findings in `.github/commit_message_template.md`, because the template's angle-bracket placeholders look like HTML elements to markdownlint:

- line 1: `<type>(<scope>): <subject> (issue #<id>)`, flagged as element `type` ([finding](https://app.codacy.com/p/681941/issues/index?resultDataId=131540516951))
- line 7: `Co-Authored-By: <AI model name> <AI model email>`, flagged as element `AI` ([finding](https://app.codacy.com/p/681941/issues/index?resultDataId=131540516953))
- line 8: `Co-Authored-By: <agent> agent <AI model email>`, flagged as element `agent` ([finding](https://app.codacy.com/p/681941/issues/index?resultDataId=131540516952))

## Problem
This file is a plain-text template, not rendered Markdown, so these findings are false positives. Some context matters here:

- The file comes from the arcanum `init-claude` skill, which copies `commit_message_template.md`, `commit_message_template-2.0.md` and `pull_request_template.md` into `.github/` whenever they are missing.
- The repo also has `.github/commit_message_template-2.0.md`, so the arcanum commit scripts use the new template shape. Nothing parses either file's content at runtime. The files only document the commit shape for humans and agents.
- `commit_message_template-2.0.md` wraps its template in a ```text fence, so markdownlint does not flag it.
- Oak has no `.codacy.yml` or `.markdownlintignore`. Arcanum solved the same problem in its own repo (arcanum #502) by listing these literal template files in `.markdownlintignore` and in its Codacy exclusions.

Renaming the placeholders (for example to `{type}`) would make oak's copy drift from the upstream arcanum template. Deleting the file would not last, because `init-claude` recreates it when it is missing.

## Expected Behavior
- Codacy no longer reports the MD033 findings listed above.
- The template content and its meaning stay unchanged, with no behavior change in commit generation.

## Solution
Exclude the literal template files from markdownlint instead of editing their content, mirroring arcanum:

- Add a `.codacy.yml` at the repo root with `exclude_paths` for `.github/commit_message_template.md`, `.github/commit_message_template-2.0.md` and `.github/pull_request_template.md`. Add a comment explaining that these are literal templates substituted verbatim into commits and PR bodies.
- Add a matching `.markdownlintignore` so local markdownlint runs agree with Codacy.
- Leave the template files untouched.

All Codacy exclusions for oak live in this `.codacy.yml`. The Codacy UI is not used to ignore files.

Owner: `architect`, since these are root-level and `.github/` files.

## Benefits
- Removes false-positive Codacy noise without diverging from the upstream arcanum templates.
- Stays stable if `init-claude` is re-run.

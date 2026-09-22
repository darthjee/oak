# Issue: Duplicate heading in infrastructure.md (markdownlint MD024)

## Problem

Codacy flags `markdownlint_MD024` ("Multiple headings with the same content"),
category BestPractice, severity Warning, at
`docs/agents/architecture/infrastructure.md:5`. The `## Infrastructure`
heading on line 5 duplicates the file's own title, `# Infrastructure` on
line 1 — MD024's default rule compares heading text across all levels, not
just among sibling headings.

Codacy finding: https://app.codacy.com/p/681941/issues/index?resultDataId=131525773121

## Solution

Rename the `## Infrastructure` heading (line 5) in
`docs/agents/architecture/infrastructure.md` to a name that describes its
content — the Docker service topology diagram — such as
`## Service Topology`, so it no longer duplicates the file's `# Infrastructure`
title. No other content changes.

## Benefits

Clears the Codacy MD024 warning and makes the file's headings unambiguous
for navigation and anchor links.

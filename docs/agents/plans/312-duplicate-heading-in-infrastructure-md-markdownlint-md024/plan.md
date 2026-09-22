# Plan: Duplicate heading in infrastructure.md (markdownlint MD024)

Issue: [312-duplicate-heading-in-infrastructure-md-markdownlint-md024.md](../../issues/312-duplicate-heading-in-infrastructure-md-markdownlint-md024.md)

## Overview

`docs/agents/architecture/infrastructure.md` has two headings with the text
"Infrastructure": the file's own title (`# Infrastructure`, line 1) and a
section heading (`## Infrastructure`, line 5). Codacy's markdownlint MD024
rule compares heading text across all levels by default, so it flags this
as a duplicate. Renaming the section heading resolves the warning.

## Context

Line 5's section introduces the Docker service topology diagram (proxy,
Rails app, MySQL, Redis, Sidekiq, photo server) that runs from line 5 to
line 21. Renaming it to `## Service Topology` describes that content
precisely and removes the text collision with the file's `# Infrastructure`
title. No other section in the file is affected.

## Implementation Steps

### Step 1 — Rename the duplicate heading

In `docs/agents/architecture/infrastructure.md`, change the heading on
line 5 from `## Infrastructure` to `## Service Topology`. Do not change
any other content in the file (the diagram, the production note, or the
`## Request Routing` section below it).

## Files to Change

- `docs/agents/architecture/infrastructure.md` — rename the `## Infrastructure` heading (line 5) to `## Service Topology`.

## Notes

- Purely a documentation heading rename; no behavior, code, or other docs reference this heading by name/anchor, so no other files need updating.

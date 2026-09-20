# Plan: Remove kind specs docs

Issue: [276-remove-kind-specs-docs.md](../issues/276-remove-kind-specs-docs.md)

## Overview

Delete the now-stale `docs/agents/specs/kind.md` design doc and its `docs/agents/specs/kind/` topic files, since the Kind feature they described (#272–#275) has fully shipped, then remove the corresponding rows from `docs/agents/summary.md` and confirm no other doc links to the removed files.

## Context

`docs/agents/specs/kind.md` and `docs/agents/specs/kind/{backend-contracts,frontend-pages,navigation}.md` were added by #272 as an up-front design reference (mirroring `docs/agents/photo_upload/`) for the backend (#273), frontend pages (#274), and navigation (#275) sub-issues of #271. All three have merged and closed, so these specs now duplicate the shipped implementation and serve no ongoing purpose.

## Implementation Steps

### Step 1 — Delete the specs files

Remove `docs/agents/specs/kind.md` and the entire `docs/agents/specs/kind/` folder.

### Step 2 — Update summary.md and verify no dangling links

Remove the four corresponding rows from `docs/agents/summary.md` ("Kind Pages", "Kind Pages — Backend Contracts", "Kind Pages — Frontend Pages", "Kind Pages — Navigation"). Then run `grep -r "specs/kind" docs/` and confirm the only remaining hits are in `docs/agents/issues/276-remove-kind-specs-docs.md` (the historical issue record, expected to keep the reference) and this plan — no other doc should still link to the removed files.

## Files to Change

- `docs/agents/specs/kind.md` — delete
- `docs/agents/specs/kind/backend-contracts.md` — delete
- `docs/agents/specs/kind/frontend-pages.md` — delete
- `docs/agents/specs/kind/navigation.md` — delete
- `docs/agents/summary.md` — remove the 4 rows referencing the deleted specs

## Notes

- This is docs-only; no production code, routes, or tests are affected, so no CI job applies.

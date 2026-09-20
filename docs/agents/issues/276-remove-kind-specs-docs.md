# Issue: Remove kind specs docs

## Description
Part of #271. The specs sub-issue of #271 (#272) added `docs/agents/specs/kind.md` and `docs/agents/specs/kind/*.md` (`backend-contracts.md`, `frontend-pages.md`, `navigation.md`) as an up-front design reference, mirroring `docs/agents/photo_upload/`, for the backend CRUD (#273), frontend pages (#274), and navigation (#275) sub-issues. All three implementation sub-issues (#273, #274, #275) are now closed, so the specs have served their purpose and are now a stale duplicate of the shipped implementation.

## Problem
Leaving `docs/agents/specs/kind/` in place after the feature ships means the docs tree carries a reference that duplicates (and will drift from) the actual code, with no ongoing purpose.

## Solution
- Delete `docs/agents/specs/kind.md` and the `docs/agents/specs/kind/` folder (`backend-contracts.md`, `frontend-pages.md`, `navigation.md`).
- Remove the four corresponding rows from `docs/agents/summary.md` (the "Kind Pages", "Kind Pages — Backend Contracts", "Kind Pages — Frontend Pages", and "Kind Pages — Navigation" entries).
- Confirm nothing else links to the removed docs: `grep -r "specs/kind" docs/` should return no hits outside of this issue's own file (which is expected to keep the historical reference).

## Benefits
Keeps `docs/agents/summary.md` and the docs tree limited to material that's still a useful reference, instead of accumulating stale specs for already-shipped features.

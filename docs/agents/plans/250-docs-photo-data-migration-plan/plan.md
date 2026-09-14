# Plan: Docs — Photo data migration plan

Issue: [250-docs-photo-data-migration-plan.md](../../issues/250-docs-photo-data-migration-plan.md)

## Overview

Write `docs/agents/photo_upload/migration-plan.md`, a new per-topic doc planning how **existing** `Oak::Photo` rows/files (ingested via `CreateItemPhotosJob`/`ProcessUserItemPhotosJob`) end up consistent with the new HTTP upload model. It builds on the `ready`-column rollout already settled in `docs/agents/photo_upload/data-model-and-migration.md` (#245) rather than re-deciding it, and covers only what that doc left open: the step-2 rollout trigger, whether a rake task is needed, and a verification checklist. Link the new doc from `docs/agents/photo_upload/index.md`.

## Context

`data-model-and-migration.md` already specifies a two-step rollout for the new `ready` boolean column: step 1 (`add_column ... default: true`, owned by #247) covers every existing row automatically with no per-row backfill; step 2 is "a follow-up migration [that] flips the column default to `false`, once `CreateItemPhotosJob` explicitly sets `ready: true` and the new Init flow explicitly sets `ready: false`" — but doesn't say what confirms that precondition or who/what triggers it. Nothing in the codebase yet establishes a rake-task or data-backfill-migration convention to follow (`db/migrate` has no such precedent, `lib/tasks` is empty).

This issue is docs-only — no code changes. It is blocked on #247 actually landing (per the issue file), so this plan should be executed only once #247's `Oak::Photo` schema/model change is merged and its actual column name/rollout matches (or is reconciled with) what `data-model-and-migration.md` describes.

## Implementation Steps

### Step 1 — Draft `docs/agents/photo_upload/migration-plan.md`

Following the structure and tone of the sibling files in `docs/agents/photo_upload/` (e.g. `edge-cases-and-coexistence.md`), write a doc with a `[← Back to Photo Upload](index.md)` link at the top, covering:

- **Step-2 trigger conditions**: what confirms it's safe to flip the `ready` column default to `false` — both `CreateItemPhotosJob` (#247) and the new Init flow (#247) must be verified to always set `ready` explicitly on every code path that creates a `Oak::Photo` row, checked before the follow-up migration is written/run.
- **Migration vs. rake task decision**: state plainly that step 1 (`add_column` with `default: true`) requires no backfill task since it already covers every existing row via the column default, and that step 2 (flipping the default) is itself just a schema migration (`change_column_default`), not a data backfill — so no rake task is needed for the `ready` column specifically. Leave the door open for a rake task only if #251's own investigation turns up rows that need something *other* than the default (e.g. clearly orphaned data, see verification below).
- **Verification checklist** (high-level, for #251 to design the concrete tooling against): after step 1 lands, confirm (a) no `Item#main_photo`/`Category#main_photo`/`Kind#main_photo` reference breaks, (b) no `Oak::Photo` row lacks a file at the path `Oak::Photo::FileUrl` derives, and (c) no file under `Settings.photos_path`'s item/photo layout lacks a matching row — without prescribing the exact script/rake task.
- **Ordering**: explicitly state the dependency chain — #245 (contracts, done) → #247 (schema/model changes, must land first) → this doc → #251 (executes the plan) — and that #249 (job deprecation) only affects whether the *old* ingestion path keeps producing new rows, not this migration.

### Step 2 — Link the new doc from the index

Add a bullet for `migration-plan.md` to `docs/agents/photo_upload/index.md`'s existing list of sub-docs (alongside Contracts / Data Model & Migration / Proxy & Auth / Edge Cases & Coexistence), and update its "Out of scope" note ("Writing the existing-photo-data migration plan ... — that's #250/#251") if the doc's existence changes that wording (e.g. from future tense to a link).

## Files to Change

- `docs/agents/photo_upload/migration-plan.md` — new doc (Step 1).
- `docs/agents/photo_upload/index.md` — add link + update out-of-scope note (Step 2).

## Notes

- Do not start actual drafting until #247 is merged and its real `ready` column/model changes are checked against what `data-model-and-migration.md` describes — reconcile the doc with reality if they diverge before writing this plan doc.
- This plan produces documentation only; #251 is the one that writes and runs the actual Rails migration(s)/rake task, per the out-of-scope note already in the issue file.

# Issue: Docs — Photo data migration plan

## Goal

Write the plan for migrating **existing** `Oak::Photo` data (rows/files already ingested via the current scan-job flow — `CreateItemPhotosJob` / `ProcessUserItemPhotosJob`) so they end up consistent with the new HTTP upload model introduced by #245–#248.

This is the doc counterpart to #251 ("Migrate existing photo data to new upload model"), the same way #245 is the doc counterpart to #246–#248. It settles the plan #251 builds against.

The plan is written as a new file, `docs/agents/photo_upload/migration-plan.md`, linked from [`photo_upload/index.md`](../photo_upload/index.md) alongside the existing per-topic docs — not folded into `data-model-and-migration.md`.

**Blocked until #247 lands.** Even though #245's doc already specifies the exact `ready`-column schema contract, this issue stays blocked on #247's actual implementation landing, in case the real schema/model changes deviate from what's documented.

## What #245 already settled

[`docs/agents/photo_upload/data-model-and-migration.md`](../photo_upload/data-model-and-migration.md) (written under #245) already specifies the schema contract this migration works against, as a two-step rollout:

1. `add_column :photos, :ready, :boolean, default: true, null: false` — existing rows read as `ready: true` automatically, with no separate per-row backfill needed for that column.
2. A later follow-up migration flips the column default to `false`, once `CreateItemPhotosJob` explicitly sets `ready: true` and the new Init flow explicitly sets `ready: false`.

Step 1 is `Oak::Photo` model/schema work owned by #247. This issue therefore does **not** need to re-decide what "migrated" means for the `ready` column — #245 already answered that. What's still open is planning everything #245 didn't cover: when/how step 2 runs safely, whether anything beyond the schema migration is needed, and how to verify existing data came through intact.

## Why this is separate from #249

`#249` ("Migration — Scan-job deprecation decision") is about the **job/process** — whether and when `CreateItemPhotosJob`/`ProcessUserItemPhotosJob` themselves get deprecated. This issue is about the **data** the job has already produced: existing `Oak::Photo` rows need to end up in a state the new upload model understands, independently of whether the old job keeps running.

## Scope

The doc must cover at least:

- The step 2 follow-up migration from `data-model-and-migration.md` (flipping the `ready` default to `false`): what confirms it's safe to run (i.e. both `CreateItemPhotosJob` and the new Init flow reliably set `ready` explicitly), and who/what triggers it.
- Whether any migration or rake task is needed beyond the schema change itself — the repo has no existing rake-task or data-backfill-migration precedent for `Oak::Photo` to follow, so this is a genuine open decision, not a defaulted convention.
- How to verify existing photos still render correctly after the rollout (no broken `main_photo` references, no orphaned files — i.e. DB rows with no file on disk at the path `Oak::Photo::FileUrl` derives, or files on disk with no matching row).
- Ordering/dependencies against #247 (actual schema changes landing) and #249 (job explicitly setting `ready: true`).

## Relationship to other sub-issues

- Builds on #245 (data model contracts) and #247 (backend model/schema changes).
- Distinct from #249 (job deprecation decision) — see "Why this is separate from #249" above.
- Blocks #251 ("Migrate existing photo data to new upload model").

## Out of scope

- Running the actual migration — that's #251.
- Deciding whether/when to retire the scan job itself — that's #249.
- Re-deciding the `ready` column schema itself — already settled in #245.

## Labels

`Documentation`, `shipit`.

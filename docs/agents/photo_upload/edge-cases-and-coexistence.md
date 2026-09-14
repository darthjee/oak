# Photo Upload — Edge Cases & Coexistence

[← Back to Photo Upload](index.md)

## Abandoned uploads

Init called, Submit/Finalize never happens — no token/expiration exists to
time these out. **No automatic cleanup for now.** `ready: false` rows are
simply excluded from every display path (see
[Data Model & Migration](data-model-and-migration.md)); accept them as
harmless debris and revisit only if it becomes an actual problem (disk
usage, DB bloat).

## Duplicate/replay

The backend **refuses** to (re-)authorize or (re-)finalize a photo that's
already `ready: true` (403/422) — mirrors majora's `Upload.STATUS_UPLOADED`
guard. Prevents a retried or duplicate Submit/Finalize call (see
[Contracts](contracts.md)) from silently overwriting an already-live photo
file.

## Relationship to the existing flow

`CreateItemPhotosJob`/`ProcessUserItemPhotosJob` (the existing
filesystem-scan-based ingestion pipeline) **stay in place and coexist**
with this new HTTP-driven upload flow. The deprecation/migration decision
for the scan job is explicitly punted to future work, not decided here:

- #249 — deciding the scan-job deprecation timeline.
- #250/#251 — writing and executing the existing-photo-data migration plan.

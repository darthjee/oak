# Issue: Backend — photo migration state and prepare/confirm endpoints

## Description

Part of #251 (migrate legacy photo files to the new storage root). Legacy photos have been broken in production since #336 switched `OAK_PHOTOS_SERVER_URL`. The migration moves their files into the new storage root and renames them to UUID names. The backend tracks per-photo migration state, owns naming, and authorizes the proxy's work.

This issue adds the migration state to `Oak::Photo` and the two endpoints the proxy uses to claim and confirm batches.

## Problem

Legacy `photos` rows point to files that only exist under the legacy root, with non-UUID names. Nothing records which photos still need moving, so the proxy cannot safely split the work into batches, retry it, or run it concurrently. Nothing gives the proxy the new target name either.

## Expected Behavior

### Backend ↔ Proxy

`POST /user/photos/migration/prepare?limit=N`: the proxy forwards the session cookie.

- `401` without a valid session.
- `200`:

```json
{
  "photos": [
    { "id": 17, "legacy_path": "users/3/items/42/abc.jpg", "file_path": "users/3/items/42/abc-<uuid>.jpg" }
  ],
  "remaining": 12
}
```

- `legacy_path` = `users/<uid>/items/<item_id>/<file_name>`.
- `file_path` = `users/<uid>/items/<item_id>/<migration_file_name>`.
- `remaining` = the caller's `ready: true` photos in `pending` + `migrating`, counted before this batch. Non-ready photos are ignored, so `remaining` can reach 0.
- `limit` defaults to 10 when absent or non-numeric and is clamped to `1..50`.

`PATCH /user/photos/migration`: the proxy forwards the session cookie.

```json
{ "migrated": [17], "missing": [18] }
```

Only the caller's rows currently in `migrating` change. Unknown ids, other users' ids and rows in other states are ignored. If an id appears in both lists, `migrated` wins. Responds `200`.

### Proxy ↔ Frontend (for reference, implemented in sibling issues)

`POST /migrations/photos?limit=N`: browser session cookie.

- `401`/`403` from `prepare` are passed through.
- `200`:

```json
{ "migrated": 3, "missing": [18], "failed": [{ "id": 19, "reason": "rename failed" }], "remaining": 9 }
```

`remaining` is adjusted for this batch: photos just set to `migrated`/`missing` are subtracted.

## Solution

- Migration adding to `photos`:
  - `migration_status`: string-backed Rails enum `pending` → `migrating` → `migrated` | `missing`; `default: 'pending'`, `null: false`.
  - `migration_file_name`: nullable string, the persisted target UUID file name.
  - `migration_claimed_at`: nullable datetime.
  - Backfill: rows whose `file_name` already matches the UUID pattern (`-<uuid>.<ext>`, uploaded through the new flow) are set to `migrated`. Everything else stays `pending`.
- Move the UUID naming out of `Oak::Photo::CreateBuilder#unique_file_name` (`<sanitized_stem>-<uuid><ext>`) into a reusable helper that both Init and the migration use.
- Init (`CreateBuilder`) creates photos with `migration_status: migrated`. `CreateItemPhotosJob` also sets `migrated`, because it reads files already in the new root (`<photos_path>/origin/...`).
- Controller in the existing `User::` namespace (`namespace :user` in `config/routes.rb`, `include LoggedUser`, like `User::CategoriesController`).
- `prepare`:
  - Candidates: the caller's `ready: true` photos that are `pending`, or `migrating` with `migration_claimed_at` older than a 5-minute timeout (a constant).
  - Each photo is claimed **atomically** with one conditional update: `UPDATE photos SET migration_status = 'migrating', migration_file_name = COALESCE(migration_file_name, <new uuid name>), migration_claimed_at = NOW() WHERE id = ? AND (migration_status = 'pending' OR (migration_status = 'migrating' AND migration_claimed_at < <now - timeout>))`.
  - Only rows actually claimed (affected = 1) are returned. Concurrent callers never get the same photo, and a re-claimed photo keeps its persisted target name.
- `PATCH`: ids in `migrated` get `file_name := migration_file_name` and `migration_status := migrated`. Ids in `missing` get `migration_status := missing`. Only the caller's rows in `migrating` are touched. The `(item_id, file_name)` unique index still holds because UUID names cannot collide.
- RSpec coverage:
  - model state and backfill;
  - a claimed row is not returned again until it is stale;
  - a stale re-claim keeps its name;
  - ownership scoping, `401`, and `limit` default/clamping;
  - non-ready rows are excluded from candidates and from `remaining`;
  - PATCH ignores foreign, unknown and non-migrating ids, and `migrated` wins when an id is in both lists.

### Assumptions

- `CreateItemPhotosJob` is only run manually by the owner, and it will not be run in production until the migration is done. So the UUID-pattern backfill does not mark rows it created after #333 as `pending`.

### Sequencing

Can be developed in parallel with the proxy and frontend sub-issues, but **merges and deploys first**. The route prefix is `/user/...`, not `/users/me/...`. The proxy sibling issue must use the same paths.

### Out of scope

- The proxy file moves and the frontend page (sibling sub-issues).
- Removing this machinery later (#379).

## Benefits

- Resumable, concurrency-safe migration driven in batches from the browser.
- The backend stays the single owner of file naming and ownership checks.
- Broken legacy photos in production get fixed.

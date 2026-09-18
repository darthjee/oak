# Issue: Backend — unique filename generation on photo upload

## Problem

Parent issue: #261.

When a photo is uploaded via the Init endpoint (`POST
/categories/:category_slug/items/:item_id/photos.json`), the backend
trusts the client-supplied `file_name` as-is
(`Items::PhotosController#photo_params`). `Oak::Photo.file_name` is
validated `uniqueness: { scope: :item_id }`, so re-uploading a file with a
name already used on that item fails:

```json
{"errors":{"file_name":["has already been taken"]},"id":null,"file_name":"arcanum.png","ready":false}
```

## Expected Behavior

Uploading a photo whose original filename collides with an existing photo
on the same item succeeds instead of failing with `"has already been
taken"`. The backend, not the client, is responsible for producing a
`file_name` that is guaranteed unique within the item's scope.

## Solution

Generate a unique `file_name` backend-side at Init time instead of trusting
the client's raw filename:

- Append a random suffix via `SecureRandom.uuid` to the filename stem
  before the extension: `arcanum.png` → `arcanum-<uuid>.png`. This mirrors
  majora's `PhotoPathBuilder`/UUIDv4 approach exactly — a random suffix for
  collision-avoidance, **not** a content hash. A true content hash (SHA256
  of file bytes) was explicitly considered and rejected: Oak's backend
  never touches raw file bytes (the Tent proxy owns them), so content
  hashing would require pushing hashing logic into the proxy — a bigger
  architectural change than this issue covers. Two uploads of the same
  physical file producing two separate rows is **not** a concern here.
- Sanitize the client-supplied filename's stem (characters/length) when
  building the unique `file_name`. This does **not** include re-validating
  the extension against an allow-list — the Tent proxy already does that at
  Submit time (`%w[jpg jpeg png]`, see `docs/agents/photo_upload/proxy-and-auth.md`)
  before any bytes are written, so backend Init doesn't need to duplicate
  it. Majora's shared architecture notes don't spell out the exact
  stem-sanitization ruleset (allowed characters, length limits, handling of
  no-extension/multi-dot filenames) — if the implementation needs those
  specifics, ask in the majora repo rather than guessing.
- Use `SecureRandom` (not `rand`), consistent with Rails convention and
  matching majora's UUIDv4 generator.

**Implementation location**: a new `Oak::Photo::CreateBuilder`
(`source/app/builders/oak/photo/create_builder.rb`), following the same
`builders/` convention already used for item/category creation
(`source/app/builders/oak/item/create_builder.rb`) and the same
`build_with:` hook `Items::PhotosController` already declares
(`resource_for Oak::Photo, ..., build_with: :build_photo`) — replacing the
current inline `build_photo` private method, which just does
`photos.build(photo_params.merge(ready: false))` today.

## Scope

- Applies **only** to the HTTP Init path (`Items::PhotosController`).
- Does **not** touch the filesystem-scan ingestion job
  (`CreateItemPhotosJob`/`ProcessUserItemPhotosJob`,
  `source/app/jobs/create_item_photos_job.rb:19`) — that job sets
  `file_name` directly to the real filename it found on disk, and must
  keep matching it.

## Backward compatibility

No migration/backfill needed — this is a generation-logic change on
create, not a data change. Existing `file_name` values are untouched. The
frontend doesn't display `file_name` as a user-facing label anywhere
(only used to build the storage URL), so a random-suffixed name has no
visible UI regression.

## Out of scope

- Photo deletion (backend endpoints, proxy route, frontend UI) — see the
  other sub-issues of #261.
- Content-based dedup — a separate feature, not this fix.

## Benefits

Users can upload multiple photos with colliding original filenames to the
same item without hitting a spurious validation error, with no behavior
change to the existing filesystem-scan ingestion path.

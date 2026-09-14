# Photo Upload — Data Model & Migration

[← Back to Photo Upload](index.md)

## Extend `Oak::Photo` directly — no new table/model

Oak has exactly one photo owner type today (`Item`, via a plain
`belongs_to`, not polymorphic — `Category`/`Kind` only get `main_photo` by
delegating through `sample_item`), and the storage path is already fully
deterministic from `item_id` + `file_name` (`Oak::Photo::FileUrl`, the same
convention `CreateItemPhotosJob` already uses). Neither of the pressures
that justify majora's generic, polymorphic `Upload` model (many owner
types; a server-generated `file_path` the proxy can't derive on its own)
apply here, so a separate model/table — 1:1 or polymorphic — would be
premature generality.

Concretely:

- Add a `ready` boolean column to the `photos` table (two-step default
  rollout, see "`ready` column rollout" below). A row's mere existence
  currently *implies* the file is on disk (it's only ever created by the
  scan job after the fact); once Init can create the row before the file
  exists, that assumption breaks and an explicit flag is needed.
- No per-upload token/expiry column is needed — auth reuses Oak's existing
  session cookie end-to-end (see [Proxy & Auth](proxy-and-auth.md)), so
  `ready` ends up being the only new column this decision requires.
- Existing associations that surface photos for display (`Item#photos`,
  `Item#main_photo`, `Category#main_photo`, `Kind#main_photo`) need a
  `ready` filter added so an in-flight upload never renders as a broken
  image. Whether an item's own edit view should still list its own pending
  (`ready: false`) photos is a UX call left to the frontend sub-issue
  (#248), not decided here.

## `CreateItemPhotosJob` must explicitly set `ready: true`

It only ever creates a row for a file it already confirmed exists on disk
(`item.photos.create!(file_name:)`), so there is no pending state on that
path at all — it must not rely on the column's default.

## Controller-driven read filtering

Ready filtering for controller-driven reads lives in the controller,
following Azeroth's nested-resource convention: the collection method a
`resource_for` call uses (e.g. `photos`) is shared by every action
generated from that call, and `show`/`update` fetch their single record via
`collection.find_by!(...)` — so it can't unconditionally exclude
`ready: false` rows, or Finalize could never find the very (not-yet-ready)
record it exists to update. The photos controller (introduced by #247)
scopes by action instead of scoping the whole method:

```ruby
def photos
  scope = item.photos
  action_name.in?(%w[index show]) ? scope.where(ready: true) : scope
end
```

`index`/`show` (read/display actions) only ever see `ready: true` photos;
`create` (Init) and `update` (Finalize) keep unscoped access, since they
legitimately operate on not-yet-ready rows.

This is a separate code path from `Oak::Item`'s own embedded photo listing
(`Oak::Item::ShowDecorator`/`IndexDecorator` exposing `photos`/`main_photo`)
— those decorators call `object.photos`/`object.main_photo` directly on the
model (`ModelDecorator` has no controller hook), bypassing any controller
method entirely. That listing needs its own equivalent `.where(ready: true)`
filtering applied at the decorator or association layer — a detail for
#247/#248 to implement, not a second instance of the Azeroth conflict above
(there's no Finalize-style "must find a not-ready row" need on that path).

## `ready` column rollout — two-step migration

1. `add_column :photos, :ready, :boolean, default: true, null: false` —
   existing rows (and anything created without an explicit value before the
   app code below ships) read as `ready: true`, matching today's implicit
   behavior. No separate backfill step or migration window where existing
   photos vanish.
2. Once `CreateItemPhotosJob` explicitly sets `ready: true` and the new
   Init flow explicitly sets `ready: false`, a follow-up migration flips
   the column default to `false` — the safe default for any future/other
   code path that doesn't know to set it explicitly, without depending on
   application code to get the transition right.

# Photo Upload — Contracts

[← Back to Photo Upload](index.md)

Concrete routes and request/response shapes for #247 (backend) and #248
(frontend) to implement against.

## Routes

Nest a photos resource under items, matching the existing
`categories → items` nesting in `source/config/routes.rb`:

```ruby
resources :items, only: %i[index show new create edit update] do
  resources :photos, only: %i[create update], controller: 'items/photos'
end
```

- **Init** — `POST /categories/:category_slug/items/:item_id/photos.json`
- **Status-gate / Finalize** — `PATCH /categories/:category_slug/items/:item_id/photos/:id.json`
  (one endpoint, two purposes — see below)

## Init

Request: `{ photo: { file_name: "cat.jpg" } }` (JSON, no file content yet).

Backend: creates the `Oak::Photo` row with `ready: false` (the column
default only covers the transition period — see
[Data Model & Migration](data-model-and-migration.md) — so Init must pass it
explicitly regardless of the current default).

Response: `{ id, file_name, ready: false }` — no `photo_url`/`snap_url` yet
(the file doesn't exist on disk; a dedicated response shape or a
conditional in `Oak::Photo::Decorator` avoids exposing URLs that would
404). The frontend uses `id` to build the Submit URL.

## Submit (proxy-owned, not a Rails route)

`POST /uploads/categories/:category_slug/items/:item_id/photos/:id/submit`,
`multipart/form-data`, single field `file`. The URL mirrors the status-gate
route's nested segments (`category_slug`/`item_id`/`id`) rather than just the
photo `:id`, since the custom Tent handler builds the backend PATCH URL below
straight from these path segments — it has no way to look up an item/category
from a bare photo id (the proxy container doesn't share the Rails process or
its DB). The frontend already has `category_slug`/`item_id` in context when
building this URL (it's on the item's edit page), so this adds no round trip.

The custom Tent handler (see [Proxy & Auth](proxy-and-auth.md) for the
extension mechanism this runs on):

1. Parses the `category_slug`/`item_id`/`id` segments from the Submit URL
   and validates extension + size (reject before any backend call or disk
   write).
2. Calls the status-gate endpoint with `{ status: "uploading" }` (`Cookie`
   header forwarded) — this is the pre-write authorization gate. Backend
   checks ownership, refuses if already `ready: true`, and responds
   `{ file_path: "users/<user_id>/items/<item_id>/<file_name>" }`. The path
   is deterministic (`Oak::Photo::FileUrl`'s convention) — the backend
   computes and returns it purely so the path-building convention lives
   once in Ruby, not duplicated in PHP.
3. Writes the file to `<photos_path>/<file_path>`.
4. Calls the status-gate endpoint again with `{ status: "ready" }` — this
   is Finalize; backend sets `ready: true`.
5. Responds 200 to the frontend. The frontend never calls Finalize itself.

## Status-gate / Finalize (shared endpoint, `PATCH .../photos/:id.json`)

One Azeroth `update` action, branching on `status` in the request body —
mirrors majora's `UploadStatusClient` hitting one endpoint with two status
values:

- `{ status: "uploading" }` → pre-write gate. Ownership check, then
  403/422 if already `ready: true` (edge case guard, see
  [Edge Cases & Coexistence](edge-cases-and-coexistence.md)) or
  expired-session/not-owner; else `200 { file_path }`.
- `{ status: "ready" }` → Finalize. Sets `ready: true`. `200` (empty body
  or the decorated photo).

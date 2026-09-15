# Issue: Backend — Init/Finalize endpoints for photo upload

## Description

Implement the backend half of Oak's new HTTP photo upload flow: the
**Init** and **Finalize** steps for `Oak::Photo`, per the contract settled
in the now-merged docs sub-issue #245 (`docs/agents/photo_upload/*.md`).

Today photos only enter the system via `CreateItemPhotosJob`, a filesystem
scan job whose only signal that a photo exists is the row itself — it
never creates a row before the file is on disk. This issue adds the two
backend-owned steps of a three-step HTTP upload flow (Init → Submit →
Finalize) that lets the frontend/proxy land a file directly, coexisting
with that scan job rather than replacing it:

| Step | Endpoint | Owner | In this issue? |
|---|---|---|---|
| 1. Init | `POST .../photos.json` | frontend → backend | Yes |
| 2. Submit (multipart) | `POST /uploads/photos/:id/submit` | Tent proxy | No — #246 |
| 3. Finalize | `PATCH .../photos/:id.json` | Tent proxy → backend | Yes (shared endpoint with Init's status-gate) |

Related sub-issues: #245 (docs, merged), #246 (proxy Submit handler,
depends on this issue's contract), #248 (frontend upload client, depends
on this issue).

## Expected Behavior

**Routes** (nest under the existing `categories → items` nesting in
`source/config/routes.rb`):

```ruby
resources :items, only: %i[index show new create edit update] do
  resources :photos, only: %i[create update], controller: 'items/photos'
end
```

- `POST /categories/:category_slug/items/:item_id/photos.json` — **Init**
- `PATCH /categories/:category_slug/items/:item_id/photos/:id.json` —
  **status-gate / Finalize** (one action, two purposes, branching on the
  `status` param)

**Init**
- Request: `{ photo: { file_name: "cat.jpg" } }`.
- Creates the `Oak::Photo` row with `ready: false` (set explicitly,
  regardless of the column's current default).
- Requires the logged-in user to own the parent item
  (`item.user == logged_user`); refuse otherwise.
- Response: `{ id, file_name, ready: false }` — no `photo_url`/`snap_url`
  (the file doesn't exist on disk yet).

**Status-gate / Finalize** (`{ status: "uploading" | "ready" }`, called by
the Tent proxy in #246, never by the frontend directly — auth is enforced
identically to any other authenticated request since the session cookie
reaches the backend unmodified through Tent):
- `status: "uploading"` — pre-write authorization gate, called before the
  proxy writes the file. Ownership check; refuse (`403`/`422`) if the
  photo is already `ready: true` (duplicate/replay guard). On success:
  `200 { file_path }`, where `file_path` is built via the existing
  `Oak::Photo::FileUrl` path convention.
- `status: "ready"` — Finalize, called after the file is written. Sets
  `ready: true`. `200`.

**Display filtering** — a not-yet-`ready` photo must never appear on any
read/display path:
- `Item#photos`, `Item#main_photo`, `Category#main_photo`, `Kind#main_photo`
  all need `ready: true` filtering added somewhere in their path.
- The new controller's `create`/`update` (Init/status-gate) actions need
  unscoped access to `item.photos` — they legitimately operate on
  not-yet-ready rows. Only `index`/`show` are display paths and get
  filtered, per the action-scoped pattern already settled in
  [Data Model & Migration](../photo_upload/data-model-and-migration.md):
  ```ruby
  def photos
    scope = item.photos
    action_name.in?(%w[index show]) ? scope.where(ready: true) : scope
  end
  ```
- `Oak::Item::ShowDecorator`/`IndexDecorator` call `object.photos`/
  `object.main_photo` directly on the model, bypassing the controller
  method above entirely. That path needs its own `ready: true` filtering:
  at the decorator layer for `Item#photos` (the raw association must stay
  unscoped, since the controller's create/update above needs unscoped
  access to the same association), or at the association layer for
  `main_photo`/`Category#main_photo`/`Kind#main_photo` (safe to scope
  directly — no competing unscoped use case for those).

## Solution

- **Migration, two steps in this same PR**:
  1. `add_column :photos, :ready, :boolean, default: true, null: false` —
     existing rows (and anything created before the app code below ships)
     keep today's implicit "always ready" behavior. No backfill step.
  2. Once `CreateItemPhotosJob` and Init both set `ready` explicitly (see
     below), a follow-up migration in the same PR flips the column
     default to `false` — the safe default for any future/other code path
     that doesn't know to set it explicitly.
- **`CreateItemPhotosJob`**: must explicitly pass `ready: true` on create —
  it has no pending state today, so it must not rely on the column
  default once step 2 above lands.
- **Routes**: nest `resources :photos, only: %i[create update], controller:
  'items/photos'` under `items` in `source/config/routes.rb`.
- **New `Items::PhotosController`**
  (`source/app/controllers/items/photos_controller.rb`), following the
  `Category::KindsController` nested-controller pattern:
  - `model_for Oak::Item, id_key: :id, param_key: :item_id` (parent) and
    `model_for Oak::Category, id_key: :slug, param_key: :category_slug`
    (grandparent), matching `ItemsController`'s existing setup.
  - `resource_for Oak::Photo, only: %i[create update], ...`, with the
    `update` action branching on `status` (`"uploading"` vs `"ready"`)
    rather than a single Azeroth-generated update.
  - Ownership guard (`item.user == logged_user`), refusing otherwise.
  - Action-scoped `photos` collection method (see Expected Behavior).
- **Model associations**: add `ready: true` scoping to `main_photo` on
  `Oak::Item`, `Oak::Category`, `Oak::Kind`; add equivalent `ready: true`
  filtering where `Oak::Item::ShowDecorator`/`IndexDecorator` read
  `object.photos` directly, without scoping the raw `Item#photos`
  association itself (needed unscoped by the new controller).
- **Tests (RSpec)**: model spec updates (`ready` default/filtering); new
  controller spec covering Init, both status-gate branches (success,
  ownership failure, already-`ready` duplicate/replay guard); updated
  specs for `CreateItemPhotosJob` and the `Item` decorators wherever
  `ready` filtering changes existing expectations.

## Out of scope

- The Tent proxy's Submit handler and its calls into the status-gate
  endpoint (#246) — this issue only needs to implement the contract side
  the proxy hands off to/from.
- The frontend upload client (#248, depends on this issue).
- Deciding/executing the scan-job deprecation or existing-photo-data
  migration (#249/#250/#251) — `CreateItemPhotosJob`/`ProcessUserItemPhotosJob`
  must keep working, only gaining the explicit `ready: true`.

## Labels

`Feature`, `shipit`.

## Benefits

Unblocks #246 (proxy Submit handler) and #248 (frontend upload client),
the two remaining pieces of the direct-upload flow, and lets a photo
appear as soon as it's uploaded instead of waiting for the next
`CreateItemPhotosJob` scan.

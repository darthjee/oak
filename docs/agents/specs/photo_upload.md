# Photo Upload — Draft Spec

> Drafting waypoint for #245. This flat file is superseded by the split
> `docs/agents/photo_upload/*.md` docs and removed once that split lands
> (see that folder's `index.md` for the canonical version of this content).

## Reference flow (from a similar system, `darthjee/majora`)

`darthjee/majora` (Django + React + Tent, same reverse-proxy pattern) implements
HTTP photo upload as three steps — a starting point, not a spec to copy
verbatim, since Oak's stack differs (Rails backend, no separate "image vs.
file" type split needed):

| Step | Endpoint | Owner | Purpose |
|---|---|---|---|
| 1. Init | `POST .../photo_upload.json` | frontend → backend | Allocates the photo record, returns an id/target for the upload. |
| 2. Submit (multipart) | `POST /uploads/<type>/<id>/submit` | Tent proxy | Receives the binary `multipart/form-data` payload, writes it to storage directly (without proxying the raw stream through the backend's request thread), then calls step 3 itself. |
| 3. Finalize | `PATCH /uploads/(image\|file)/<id>.json` | **Tent proxy** (not frontend) | Marks the photo as `ready` for display, once the Submit step has landed the file. |

Correction to the reference framing: majora's documented "pitfall" (Finalize
is tested but never called, so files never flip to `ready`) is a false
reading of majora's own `unused-endpoints.md`. Majora's Tent proxy extension
(`UploadHandler.php` + `UploadStatusClient.php`) actually calls that same
PATCH endpoint itself — once with `status=uploading` (to obtain `file_path`
before writing) and again with `status=uploaded` right after writing the
file, which is what flips the object to `ready`. The endpoint only looks
"unused" because majora's detection script only checks frontend JS calling
conventions and has no visibility into the proxy's own PHP-to-backend calls.

## Finalize ownership

**The Tent proxy owns the Finalize/ready transition, not the frontend.** The
Submit handler (a new custom Tent extension) calls the backend's Finalize
endpoint itself immediately after successfully writing the uploaded file to
disk. The frontend never calls Finalize directly — from its perspective, a
successful Submit response means the photo is already `ready`.

Why:

- Oak's current proxy config (`docker_volumes/proxy_configuration/rules/*.php`)
  only uses Tent's built-in handlers (`default_proxy`, `proxy`, `static`) —
  none of which can parse `multipart/form-data` and write a file to disk.
  Handling Submit at all requires introducing Tent's extension mechanism (a
  custom `RequestHandler` class mounted via `proxy/extension/loader.php`) —
  new infrastructure for Oak either way, not something proxy-owned Finalize
  adds on its own.
- Given that custom handler is being written regardless, one more outbound
  PATCH call to the backend at the end of it is a small addition — not a new
  infrastructure decision.
- It removes an entire failure class: with frontend-owned Finalize, a closed
  tab, navigation, or JS error between Submit succeeding and the Finalize
  call leaves the photo on disk but stuck un-`ready` with nothing to retry
  it. Proxy-owned Finalize makes that transition depend only on a
  server-to-server hop within the same docker network, independent of what
  the browser does next.
- A hybrid (proxy owns it, frontend also calls it idempotently as a
  fallback) was considered and rejected for now as unnecessary complexity —
  revisit only if the proxy→backend hop proves unreliable in practice.

## Data model shape

**Extend `Oak::Photo` directly — no new table/model.** Oak has exactly one
photo owner type today (`Item`, via a plain `belongs_to`, not polymorphic —
`Category`/`Kind` only get `main_photo` by delegating through `sample_item`),
and the storage path is already fully deterministic from `item_id` +
`file_name` (`Oak::Photo::FileUrl`, the same convention `CreateItemPhotosJob`
already uses). Neither of the pressures that justify majora's generic,
polymorphic `Upload` model (many owner types; a server-generated `file_path`
the proxy can't derive on its own) apply here, so a separate model/table —
1:1 or polymorphic — would be premature generality.

Concretely:

- Add a `ready` boolean column to the `photos` table (two-step default
  rollout, see "Backward compatibility / coexistence" below). A row's mere
  existence currently *implies* the file is on disk (it's only ever created
  by the scan job after the fact); once Init can create the row before the
  file exists, that assumption breaks and an explicit flag is needed.
- No per-upload token/expiry column is needed (see "Auth/security between
  proxy and backend" below) — auth reuses Oak's existing session cookie
  end-to-end, so `ready` ends up being the only new column this decision
  requires.
- Existing associations that surface photos for display (`Item#photos`,
  `Item#main_photo`, `Category#main_photo`, `Kind#main_photo`) need a
  `ready` filter added so an in-flight upload never renders as a broken
  image. Whether an item's own edit view should still list its own pending
  (`ready: false`) photos is a UX call left to the frontend sub-issue
  (#248), not decided here.

## Auth/security between proxy and backend

**Reuse Oak's existing session-cookie auth end-to-end — no bespoke upload
token.** Unlike majora (which needs its own `X-Upload-Token`/expiration
scheme), Oak already has signed-cookie session auth
(`cookies.signed[:session]`, backed by the `sessions` table) flowing through
the Tent proxy today: `ApplicationController` sets `X-Skip-Cache` based on
that cookie, and `backend.php`'s `default_proxy` rule already consumes it
(`skip_cache_header => 'X-Skip-Cache'`) — proof the `Cookie` header already
reaches the backend unmodified through Tent (nothing in Tent's middlewares
strips it; only `Host` gets rewritten).

Concretely:

- The new custom Submit handler forwards the incoming `Cookie` header on its
  own outbound calls to the backend.
- Backend's Init and Finalize actions apply the same `require_user_for` +
  item-ownership checks `ItemsController` already uses elsewhere
  (`photo.item.user == logged_user`) — no new auth primitive.
- No `token`/`expiration_time` columns needed on `photos` for auth purposes
  — `ready` is the only new column needed for auth/lifecycle purposes; a
  separate abandoned-upload cleanup mechanism, if wanted, is an edge case,
  not an auth concern (see Edge cases below).
- Keep a **pre-write authorization gate**: the Submit handler calls the
  backend *before* writing the uploaded bytes to disk (cookie forwarded,
  ownership verified), mirroring the shape of majora's pre-write "uploading"
  call — but for Oak this call exists purely to authorize the write, not to
  obtain `file_path` (Oak's path is already deterministic). This prevents
  the proxy from ever writing unauthorized/unauthenticated bytes to disk.

## Edge cases

- **Abandoned uploads** (Init called, Submit/Finalize never happens — no
  token/expiration exists to time these out): **no automatic cleanup for
  now.** `ready: false` rows are simply excluded from every display path;
  accept them as harmless debris and revisit only if it becomes an actual
  problem (disk usage, DB bloat).
- **Duplicate/replay**: the backend **refuses** to (re-)authorize or
  (re-)finalize a photo that's already `ready: true` (403/422) — mirrors
  majora's `Upload.STATUS_UPLOADED` guard. Prevents a retried or duplicate
  Submit/Finalize call from silently overwriting an already-live photo file.
- **Upload validation at the proxy** (the only place that sees the raw
  bytes before they land on disk): the Submit handler validates the file
  **extension against an allow-list** — reusing the existing
  `%w[jpg jpeg png]` list `CreateItemPhotosJob` already uses — **and a max
  size**, via a new `Settings` entry (e.g. `photo_max_upload_size_bytes`; no
  such setting exists today) to guard against disk exhaustion. Both checks
  happen before any byte is written to disk, consistent with the pre-write
  authorization gate above.

## Backward compatibility / coexistence

**`CreateItemPhotosJob` must explicitly create rows with `ready: true`.** It
only ever creates a row for a file it already confirmed exists on disk
(`item.photos.create!(file_name:)`), so there is no pending state on that
path at all — it must not rely on the column's default.

**Ready filtering for controller-driven reads lives in the controller,
following Azeroth's nested-resource convention**: the collection method a
`resource_for` call uses (e.g. `photos`) is shared by every action generated
from that call, and `show`/`update` fetch their single record via
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

**`ready` column rollout — two-step migration:**

1. `add_column :photos, :ready, :boolean, default: true, null: false` —
   existing rows (and anything created without an explicit value before the
   app code below ships) read as `ready: true`, matching today's implicit
   behavior. No separate backfill step or migration window where existing
   photos vanish.
2. Once `CreateItemPhotosJob` explicitly sets `ready: true` and the new Init
   flow explicitly sets `ready: false`, a follow-up migration flips the
   column default to `false` — the safe default for any future/other code
   path that doesn't know to set it explicitly, without depending on
   application code to get the transition right.

## Agent ownership

This flow requires introducing Tent's extension mechanism — a new
top-level `proxy/` folder (`proxy/extension/loader.php`, custom PHP
`RequestHandler` classes) alongside the existing `docker_volumes/proxy_configuration/`.
That's a new root-level folder, so per this repo's agent-roster convention
it needs an explicit owner rather than falling to whichever agent happens to
touch it first.

**Decision: a new `proxy` specialist agent** (spun off as #252,
`.claude/agents/proxy.md`) owns `docker_volumes/proxy_configuration/` and
the new `proxy/` folder — reassigned from `architect`, which #244's original
split had pencilled in before this doc surfaced the extension-mechanism
requirement. #246 is updated accordingly.

## Concrete contracts

### Routes (for #247 to implement)

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

### Init

Request: `{ photo: { file_name: "cat.jpg" } }` (JSON, no file content yet).

Backend: creates the `Oak::Photo` row with `ready: false` (the column
default only covers the transition period — see the two-step migration
decision — so Init must pass it explicitly regardless of the current
default).

Response: `{ id, file_name, ready: false }` — no `photo_url`/`snap_url` yet
(the file doesn't exist on disk; a dedicated response shape or a
conditional in `Oak::Photo::Decorator` avoids exposing URLs that would
404). The frontend uses `id` to build the Submit URL.

### Submit (proxy-owned, not a Rails route)

`POST /uploads/photos/:id/submit`, `multipart/form-data`, single field
`file`.

The custom Tent handler:

1. Validates extension + size (reject before any backend call or disk
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

### Status-gate / Finalize (shared endpoint, `PATCH .../photos/:id.json`)

One Azeroth `update` action, branching on `status` in the request body —
mirrors majora's `UploadStatusClient` hitting one endpoint with two status
values:

- `{ status: "uploading" }` → pre-write gate. Ownership check, then
  403/422 if already `ready: true` (edge case guard) or expired-session/not-owner;
  else `200 { file_path }`.
- `{ status: "ready" }` → Finalize. Sets `ready: true`. `200` (empty body
  or the decorated photo).

## Relationship to the existing flow

`CreateItemPhotosJob`/`ProcessUserItemPhotosJob` (the existing filesystem
scan-based ingestion pipeline) stay in place and coexist with this new
HTTP-driven flow — the deprecation/migration decision for the scan job is
explicitly punted to #249/#250/#251, not decided here.

## Out of scope

- Implementing any of the above (proxy rule, backend endpoints, frontend
  client) — that's #246/#247/#248.
- Deciding the scan-job deprecation timeline — that's #249.
- Writing the existing-photo-data migration plan and executing it — that's
  #250/#251.
- Actually creating the `proxy` agent config — that's #252.

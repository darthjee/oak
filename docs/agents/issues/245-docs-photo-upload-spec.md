# Issue: Docs — Photo upload spec

## Description

Write `docs/agents/specs/photo_upload.md` describing the target architecture and flow for HTTP photo upload of items, then split it into `docs/agents/photo_upload/*.md` — mirroring how `docs/agents/architecture/`, `docs/agents/routes/`, etc. are already split into per-topic files (see #238/#239/#240/#241/#242 for the pattern).

This is a sub-issue of #244 ("Add photo upload for items"). It settles the exact contracts the other implementation sub-issues build against — **it blocks #246 (proxy), #247 (backend), and #248 (frontend)**, which should not start implementation until this doc is merged.

## Problem

Three implementation sub-issues (proxy, backend, frontend) each need a single settled source of truth for the upload flow's contracts before they can build independently, without guessing at each other's request/response shapes.

The most obvious reference architecture, `darthjee/majora` (same Rails-adjacent Tent proxy pattern, Django + React instead of Rails), isn't a drop-in fit for Oak's stack — and one part of its own documentation (a "pitfall" about a Finalize endpoint that's supposedly tested but never called) turned out to be a misreading of majora's own code, not an actual gap. The contract can't simply be copied; it has to be worked out and settled here, grounded in what Oak's own codebase already provides (auth, storage conventions, proxy setup) rather than in majora's.

## Expected Behavior

`docs/agents/specs/photo_upload.md` is written, then split into `docs/agents/photo_upload/*.md` following the existing per-topic doc pattern. The document settles, at minimum:

- The end-to-end upload flow — request/response shape for each step (Init / Submit / Finalize), and which layer (frontend / proxy / backend) owns each step.
- The new Tent proxy rule needed to accept `multipart/form-data` submissions and hand them off without routing the raw file stream through the Rails app (a *new rule* on Oak's existing `oak_proxy`, not new infra at the docker-compose level — though it does require introducing Tent's extension mechanism for the first time, see Solution below).
- New backend model/controller/route changes for `Oak::Photo` init + finalize requests.
- The new frontend upload client's responsibilities driving the flow from the item form.
- Storage target stays local filesystem, same as today (`Settings.photos_path`) — no ActiveStorage / cloud storage migration in scope.
- A "Relationship to the existing flow" section stating that `CreateItemPhotosJob`/`ProcessUserItemPhotosJob` stay in place and coexist with the new flow — the deprecation/migration decision itself is explicitly punted to #249/#250/#251, not decided here.

## Solution

### Reference flow (from a similar system, `darthjee/majora`)

`darthjee/majora` (Django + React + Tent, same proxy) implements this as three steps — a starting point, not a spec to copy verbatim, since Oak's stack differs (Rails backend, no separate "image vs. file" type split needed):

| Step | Endpoint | Owner | Purpose |
|---|---|---|---|
| 1. Init | `POST .../photo_upload.json` | frontend → backend | Allocates the photo record, returns an id/target for the upload. |
| 2. Submit (multipart) | `POST /uploads/<type>/<id>/submit` | Tent proxy | Receives the binary `multipart/form-data` payload, writes it to storage directly (without proxying the raw stream through the backend's request thread), then calls step 3 itself — see "Finalize ownership" below. |
| 3. Finalize | `PATCH /uploads/(image\|file)/<id>.json` | **Tent proxy** (not frontend — see below) | Marks the photo as `ready` for display, once the submit step has landed the file. |

Correction to the original framing: majora's documented "pitfall" (finalize is tested but never called, so files never flip to `ready`) turns out to be a false reading of majora's own `unused-endpoints.md`. Majora's Tent proxy extension (`UploadHandler.php` + `UploadStatusClient.php`) actually calls that same PATCH endpoint itself — once with `status=uploading` (to obtain `file_path` before writing) and again with `status=uploaded` right after writing the file, which is what flips the object to `ready`. The endpoint only looks "unused" because majora's detection script only checks frontend JS calling conventions and has no visibility into the proxy's own PHP-to-backend calls.

### Finalize ownership

**The Tent proxy owns the Finalize/ready transition, not the frontend.** The Submit handler (new custom Tent extension) calls the backend's Finalize endpoint itself immediately after successfully writing the uploaded file to disk. The frontend never calls Finalize directly — from its perspective, a successful Submit response means the photo is already `ready`.

Why:

- Oak's current proxy config (`docker_volumes/proxy_configuration/rules/*.php`) only uses Tent's built-in handlers (`default_proxy`, `proxy`, `static`) — none of which can parse `multipart/form-data` and write a file to disk. Handling Submit at all requires introducing Tent's extension mechanism (a custom `RequestHandler` class mounted via `proxy/extension/loader.php`) — new infrastructure for Oak either way, not something proxy-owned Finalize adds on its own.
- Given that custom handler is being written regardless, one more outbound PATCH call to the backend at the end of it is a small addition — not a new infrastructure decision.
- It removes an entire failure class: with frontend-owned Finalize, a closed tab, navigation, or JS error between Submit succeeding and the Finalize call leaves the photo on disk but stuck un-`ready` with nothing to retry it. Proxy-owned Finalize makes that transition depend only on a server-to-server hop within the same docker network, independent of what the browser does next.
- A hybrid (proxy owns it, frontend also calls it idempotently as a fallback) was considered and rejected for now as unnecessary complexity — revisit only if the proxy→backend hop proves unreliable in practice.

### Data model shape

**Extend `Oak::Photo` directly — no new table/model.** Oak has exactly one photo owner type today (`Item`, via a plain `belongs_to`, not polymorphic — `Category`/`Kind` only get `main_photo` by delegating through `sample_item`), and the storage path is already fully deterministic from `item_id` + `file_name` (`Oak::Photo::FileUrl`, same convention `CreateItemPhotosJob` already uses). Neither of the pressures that justify majora's generic, polymorphic `Upload` model (many owner types; a server-generated `file_path` the proxy can't derive on its own) apply here, so a separate model/table — 1:1 or polymorphic — would be premature generality.

Concretely:

- Add a `ready` boolean column to the `photos` table (see "Backward compatibility / coexistence" below for the two-step default rollout). A row's mere existence currently *implies* the file is on disk (it's only ever created by the scan job after the fact); once Init can create the row before the file exists, that assumption breaks and an explicit flag is needed.
- No per-upload token/expiry column is needed (see "Auth/security between proxy and backend" below) — auth reuses Oak's existing session cookie end-to-end, so `ready` ends up being the only new column this decision requires.
- Existing associations that surface photos for display (`Item#photos`, `Item#main_photo`, `Category#main_photo`, `Kind#main_photo`) need a `ready` filter added so an in-flight upload never renders as a broken image. Whether an item's own edit view should still list its own pending (`ready: false`) photos is a UX call left to the frontend sub-issue (#248), not decided here.

### Auth/security between proxy and backend

**Reuse Oak's existing session-cookie auth end-to-end — no bespoke upload token.** Unlike majora (which needs its own `X-Upload-Token`/expiration scheme), Oak already has signed-cookie session auth (`cookies.signed[:session]`, backed by the `sessions` table) flowing through the Tent proxy today: `ApplicationController` sets `X-Skip-Cache` based on that cookie, and `backend.php`'s `default_proxy` rule already consumes it (`skip_cache_header => 'X-Skip-Cache'`) — proof the `Cookie` header already reaches the backend unmodified through Tent (nothing in Tent's middlewares strips it; only `Host` gets rewritten).

Concretely:

- The new custom Submit handler forwards the incoming `Cookie` header on its own outbound calls to the backend.
- Backend's Init and Finalize actions apply the same `require_user_for` + item-ownership checks `ItemsController` already uses elsewhere (`photo.item.user == logged_user`) — no new auth primitive.
- No `token`/`expiration_time` columns needed on `photos` for auth purposes — `ready` is the only new column needed for auth/lifecycle purposes; a separate abandoned-upload cleanup mechanism, if wanted, is an edge case, not an auth concern (see Edge cases below).
- Keep a **pre-write authorization gate**: the Submit handler calls the backend *before* writing the uploaded bytes to disk (cookie forwarded, ownership verified), mirroring the shape of majora's pre-write "uploading" call — but for Oak this call exists purely to authorize the write, not to obtain `file_path` (Oak's path is already deterministic). This prevents the proxy from ever writing unauthorized/unauthenticated bytes to disk.

### Edge cases

- **Abandoned uploads** (Init called, Submit/Finalize never happens — no token/expiration exists to time these out): **no automatic cleanup for now.** `ready: false` rows are simply excluded from every display path; accept them as harmless debris and revisit only if it becomes an actual problem (disk usage, DB bloat).
- **Duplicate/replay**: the backend **refuses** to (re-)authorize or (re-)finalize a photo that's already `ready: true` (403/422) — mirrors majora's `Upload.STATUS_UPLOADED` guard. Prevents a retried or duplicate Submit/Finalize call from silently overwriting an already-live photo file.
- **Upload validation at the proxy** (the only place that sees the raw bytes before they land on disk): the Submit handler validates the file **extension against an allow-list** — reusing the existing `%w[jpg jpeg png]` list `CreateItemPhotosJob` already uses — **and a max size**, via a new `Settings` entry (e.g. `photo_max_upload_size_bytes`; no such setting exists today) to guard against disk exhaustion. Both checks happen before any byte is written to disk, consistent with the pre-write authorization gate above.

### Backward compatibility / coexistence

**`CreateItemPhotosJob` must explicitly create rows with `ready: true`.** It only ever creates a row for a file it already confirmed exists on disk (`item.photos.create!(file_name:)`), so there is no pending state on that path at all — it must not rely on the column's default.

**Ready filtering for controller-driven reads lives in the controller, following Azeroth's nested-resource convention**: the collection method a `resource_for` call uses (e.g. `photos`) is shared by every action generated from that call, and `show`/`update` fetch their single record via `collection.find_by!(...)` — so it can't unconditionally exclude `ready: false` rows, or Finalize could never find the very (not-yet-ready) record it exists to update. The photos controller (introduced by #247) scopes by action instead of scoping the whole method:

```ruby
def photos
  scope = item.photos
  action_name.in?(%w[index show]) ? scope.where(ready: true) : scope
end
```

`index`/`show` (read/display actions) only ever see `ready: true` photos; `create` (Init) and `update` (Finalize) keep unscoped access, since they legitimately operate on not-yet-ready rows.

This is a separate code path from `Oak::Item`'s own embedded photo listing (`Oak::Item::ShowDecorator`/`IndexDecorator` exposing `photos`/`main_photo`) — those decorators call `object.photos`/`object.main_photo` directly on the model (`ModelDecorator` has no controller hook), bypassing any controller method entirely. That listing needs its own equivalent `.where(ready: true)` filtering applied at the decorator or association layer — a detail for #247/#248 to implement, not a second instance of the Azeroth conflict above (there's no Finalize-style "must find a not-ready row" need on that path).

**`ready` column rollout — two-step migration:**

1. `add_column :photos, :ready, :boolean, default: true, null: false` — existing rows (and anything created without an explicit value before the app code below ships) read as `ready: true`, matching today's implicit behavior. No separate backfill step or migration window where existing photos vanish.
2. Once `CreateItemPhotosJob` explicitly sets `ready: true` and the new Init flow explicitly sets `ready: false`, a follow-up migration flips the column default to `false` — the safe default for any future/other code path that doesn't know to set it explicitly, without depending on application code to get the transition right.

### Agent ownership

This flow requires introducing Tent's extension mechanism — a new top-level `proxy/` folder (`proxy/extension/loader.php`, custom PHP `RequestHandler` classes) alongside the existing `docker_volumes/proxy_configuration/`. That's a new root-level folder, so per this repo's agent-roster convention it needs an explicit owner rather than falling to whichever agent happens to touch it first.

**Decision: a new `proxy` specialist agent** (spun off as #252, `.claude/agents/proxy.md`) owns `docker_volumes/proxy_configuration/` and the new `proxy/` folder — reassigned from `architect`, which #244's original split had pencilled in before this doc surfaced the extension-mechanism requirement. #246 is updated accordingly.

### Out of scope

- Implementing any of the above (proxy rule, backend endpoints, frontend client) — that's #246/#247/#248.
- Deciding the scan-job deprecation timeline — that's #249.
- Writing the existing-photo-data migration plan and executing it — that's #250/#251.
- Actually creating the `proxy` agent config — that's #252.

## Benefits

- Unblocks #246 (proxy), #247 (backend), and #248 (frontend) to build against a single settled contract instead of guessing at each other's request/response shapes.
- Avoids majora's real failure mode (Finalize silently never firing) by design, having the proxy own the ready transition instead of the frontend.
- Keeps Oak's data model minimal — no premature polymorphic `Upload` model — matching the single-owner-type reality Oak actually has today.
- Reuses Oak's existing session-cookie auth instead of inventing a parallel token/expiration scheme, reducing new surface area to review and maintain.
- Explicit two-step migration plan for the `ready` column avoids a regression window where existing photos would vanish from display.

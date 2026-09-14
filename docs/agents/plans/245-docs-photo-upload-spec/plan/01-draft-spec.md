# Draft the spec

Write a single working draft at `docs/agents/specs/photo_upload.md` (a drafting waypoint — see Step 2) covering everything below. Most of this is transcription from issue #245's body, already fully decided; the one piece of real synthesis is nailing down concrete request/response contracts, since the issue settled the architecture-level decisions but not the literal wire shapes #246/#247/#248 need.

## Transcribe from issue #245 (already decided, not open questions)

- The reference flow table (Init / Submit / Finalize) and the correction note about majora's `unused-endpoints.md` being a false positive (the proxy calls Finalize itself; it only *looks* frontend-unused).
- **Finalize ownership**: the Tent proxy owns it, not the frontend, and why (custom extension handler is required for Submit regardless; removes the closed-tab/failure-class risk; hybrid fallback rejected for now).
- **Data model shape**: `Oak::Photo` gets one new `ready` boolean column, no new table/model, and why (single owner type, deterministic storage path, no token/expiry needed).
- **Auth/security**: session-cookie reuse end-to-end (`Cookie` header forwarded by the Submit handler, same `require_user_for`/ownership checks as `ItemsController`), plus the pre-write authorization gate.
- **Edge cases**: no cleanup job for abandoned `ready: false` rows, duplicate/replay refused (403/422) once `ready: true`, extension allow-list (`jpg`/`jpeg`/`png`, reusing `CreateItemPhotosJob`'s list) + a new max-size `Settings` entry, both enforced before any byte is written to disk.
- **Backward compatibility**: `CreateItemPhotosJob` explicitly sets `ready: true`; the photos controller's `photos` method scopes by `action_name` (reproduce the snippet from issue #245's "Backward compatibility / coexistence" section); `Oak::Item`'s embedded `photos`/`main_photo` decorators need their own equivalent filtering since they bypass the controller; the two-step migration (`default: true` first, flipped to `false` later).
- **Agent ownership**: the new `proxy/` folder (Tent extension mechanism) and `docker_volumes/proxy_configuration/` are owned by the new `proxy` specialist agent (#252), not `architect`.

## Work out: concrete contracts

### Routes (for #247 to implement)

Nest a photos resource under items, matching the existing `categories → items` nesting in `source/config/routes.rb`:

```ruby
resources :items, only: %i[index show new create edit update] do
  resources :photos, only: %i[create update], controller: 'items/photos'
end
```

- **Init** — `POST /categories/:category_slug/items/:item_id/photos.json`
- **Status-gate / Finalize** — `PATCH /categories/:category_slug/items/:item_id/photos/:id.json` (one endpoint, two purposes — see below)

### Init

Request: `{ photo: { file_name: "cat.jpg" } }` (JSON, no file content yet).
Backend: creates the `Oak::Photo` row with `ready: false` (the column default only covers the transition period — see the two-step migration decision — so Init must pass it explicitly regardless of the current default).
Response: `{ id, file_name, ready: false }` — no `photo_url`/`snap_url` yet (the file doesn't exist on disk; a dedicated response shape or a conditional in `Oak::Photo::Decorator` avoids exposing URLs that would 404). The frontend uses `id` to build the Submit URL.

### Submit (proxy-owned, not a Rails route)

`POST /uploads/photos/:id/submit`, `multipart/form-data`, single field `file`.

The custom Tent handler:
1. Validates extension + size (reject before any backend call or disk write).
2. Calls the status-gate endpoint with `{ status: "uploading" }` (`Cookie` header forwarded) — this is the pre-write authorization gate. Backend checks ownership, refuses if already `ready: true`, and responds `{ file_path: "users/<user_id>/items/<item_id>/<file_name>" }`. The path is deterministic (`Oak::Photo::FileUrl`'s convention) — the backend computes and returns it purely so the path-building convention lives once in Ruby, not duplicated in PHP.
3. Writes the file to `<photos_path>/<file_path>`.
4. Calls the status-gate endpoint again with `{ status: "ready" }` — this is Finalize; backend sets `ready: true`.
5. Responds 200 to the frontend. The frontend never calls Finalize itself.

### Status-gate / Finalize (shared endpoint, `PATCH .../photos/:id.json`)

One Azeroth `update` action, branching on `status` in the request body — mirrors majora's `UploadStatusClient` hitting one endpoint with two status values:

- `{ status: "uploading" }` → pre-write gate. Ownership check, then 403/422 if already `ready: true` (edge case guard) or expired-session/not-owner; else `200 { file_path }`.
- `{ status: "ready" }` → Finalize. Sets `ready: true`. `200` (empty body or the decorated photo).

## Files to Change

- `docs/agents/specs/photo_upload.md` — new (draft; removed in Step 2 once split)

# Issue: Proxy — Tent multipart submit rule

## Goal

Implement the Tent proxy's handling of the "Submit" step of the photo upload flow: a custom Tent `RequestHandler`, mounted via a new `proxy/extension/loader.php`, that receives the `multipart/form-data` upload, validates it, authorizes and writes the file directly to storage (without routing the raw file stream through the Rails app's request thread), and then finalizes the photo — per the contract settled in `docs/agents/photo_upload/contracts.md` and `docs/agents/photo_upload/proxy-and-auth.md`.

**Depends on #247** (Backend — Init/Finalize endpoints) and **#252** (Add proxy specialist agent) — do not start until both are merged. #247 provides the status-gate/Finalize endpoint (`PATCH /categories/:category_slug/items/:item_id/photos/:id.json`) this handler calls; #252 gives `docker_volumes/proxy_configuration/` and the new `proxy/` folder an assigned owning agent, per `docs/agents/photo_upload/proxy-and-auth.md` ("New `proxy/` folder and agent ownership").

## Scope

- New `proxy/extension/loader.php` plus a custom Tent `RequestHandler` class — Tent's built-in `default_proxy`/`proxy`/`static` handlers can't parse `multipart/form-data` or write files to disk (see `docs/agents/external/HOW_TO_USE_DARTHJEE-TENT.md` → Extending Tent). This is new infrastructure for Oak (the first custom handler), not an addition to the existing `backend.php`/`frontend.php`/`redirects.php` rule files.
- A new rule under `docker_volumes/proxy_configuration/` wiring `POST /uploads/photos/:id/submit` to the custom handler.
- Handler behavior (per `docs/agents/photo_upload/contracts.md` — "Submit"):
  1. Validate the file extension against an allow-list (reuse `CreateItemPhotosJob`'s `%w[jpg jpeg png]`) and a max size, rejecting before any backend call or disk write. The max size comes from backend's `Settings.photo_max_upload_size_bytes` (#247), mirrored into the `oak_proxy` container as an env var (docker-compose) — the PHP handler reads it from the environment rather than duplicating the value.
  2. Forward the incoming `Cookie` header and call the backend status-gate endpoint with `{ status: "uploading" }` — the pre-write authorization gate; backend responds `{ file_path }`.
  3. Write the file to `<photos_path>/<file_path>`.
  4. Call the status-gate endpoint again with `{ status: "ready" }` — Finalize.
  5. Respond 200 to the frontend. The frontend never calls Finalize itself.
- Update `docs/agents/photo_upload/*.md` if the actual implementation deviates from what's documented.

## Out of scope

- Backend Init/status-gate/Finalize endpoints themselves (#247).
- Frontend upload client (#248).
- Creating the `proxy` specialist agent config (#252).

## Labels

`Feature`, `shipit`.

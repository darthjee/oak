# Issue: Proxy — photo deletion route and handler

## Problem

Parent issue: #261. Oak's Tent proxy has no photo deletion route — only
the Submit route/handler exists today (`proxy/extension/PhotoSubmitRequestHandler.php`,
`docker_volumes/proxy_configuration/rules/uploads.php`).

The backend already exposes the deletion contract (#263, merged):
`POST /categories/:category_slug/items/:item_id/photos/:id/deletable.json`
(returns `{ file_path }` when the photo is `ready`) and
`DELETE /categories/:category_slug/items/:item_id/photos/:id.json` (removes
the DB row). But only the proxy container has filesystem access to the
photos directory (`docker-compose.yml` mounts `./dev_public_files:/tmp/photos`
on `oak_proxy`/`oak_sidekiq`, not on `oak_app`/the backend), so the actual
file unlink must happen in the proxy — the same reason Submit is
proxy-owned rather than a direct Rails route.

## Solution

Add a new proxy-owned deletion route (not frontend-callable directly via
Rails):

- `DELETE /uploads/categories/:category_slug/items/:item_id/photos/:id` —
  new rule alongside `docker_volumes/proxy_configuration/rules/uploads.php`
  (or a new `deletes.php`), routed to a new `PhotoDeleteRequestHandler.php`
  sitting next to `PhotoSubmitRequestHandler.php`.
- Also retrofit `PhotoSubmitRequestHandler::writeFile()` with the same
  path-traversal guard described below — it currently has none, so this
  issue brings both the write and delete paths to the same defense-in-depth
  posture instead of introducing an asymmetry.

The handler:

1. Calls the backend's `deletable.json` (`POST .../photos/:id/deletable.json`,
   cookie forwarded, same auth reuse as Submit's status-gate call) → gets
   `file_path`. Backend responds `200 { file_path }` when the photo is
   `ready`, `422` if not ready yet, `403` if the user doesn't own the item,
   or a redirect if not logged in — relay any non-2xx response as-is,
   same as Submit's gate call.
2. Deletes the file from `<photosPath>/<file_path>`.
3. Calls the backend `DELETE .../photos/:id.json` (cookie forwarded) to
   remove the row.
4. Responds 200 to the frontend.

### Decided edge-case behavior

- If the file is already missing on disk when the handler attempts to
  delete it, treat as a harmless no-op (log it, don't error).
- Delete ordering mirrors majora: the file is deleted from disk **first**,
  then the backend `DELETE`s the DB row — so a partial failure leaves an
  orphaned-but-harmless missing-file reference rather than a dangling file
  with no owning row.

### Security

- **Path-traversal guard, defense-in-depth**: even though `file_path` is
  backend-computed (not client-supplied) for both delete and submit, both
  `PhotoDeleteRequestHandler` and `PhotoSubmitRequestHandler::writeFile()`
  resolve the real filesystem path and confirm it stays under the
  `photosPath` root before unlinking/writing. `PhotoSubmitRequestHandler`
  doesn't have this guard today — adding it there is in scope for this
  issue, so both handlers end up with the same discipline rather than an
  asymmetry between write and delete.
- Session-cookie auth reuse, same as Submit — no new auth primitive.

### Dependency

Backend deletion endpoints (#263 — `deletable`/`destroy` on
`Items::PhotosController`) are already merged, so this proxy work is fully
unblocked and can start immediately — same contract-split pattern as #246
(proxy)/#247 (backend).

### Out of scope

- The backend `deletable.json`/`DELETE` endpoints themselves (already
  covered by #263).
- The frontend trigger/UI for delete (separate sub-issue).

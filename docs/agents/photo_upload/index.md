# Photo Upload

Oak's new HTTP photo upload flow lets the frontend upload a photo directly
(rather than only through the filesystem scan job), via three steps — a
starting point adapted from `darthjee/majora` (Django + React + Tent, same
reverse-proxy pattern), not a spec copied verbatim, since Oak's stack
differs (Rails backend, no separate "image vs. file" type split needed):

| Step | Endpoint | Owner | Purpose |
|---|---|---|---|
| 1. Init | `POST .../photos.json` | frontend → backend | Allocates the `Oak::Photo` record (`ready: false`), returns an id the frontend uses to build the Submit URL. |
| 2. Submit (multipart) | `POST /uploads/photos/:id/submit` | Tent proxy | Receives the binary `multipart/form-data` payload, writes it to storage directly (without proxying the raw stream through the backend's request thread), then calls step 3 itself. |
| 3. Finalize | `PATCH .../photos/:id.json` | **Tent proxy** (not frontend) | Marks the photo as `ready` for display, once Submit has landed the file. |

**The Tent proxy owns the Finalize/ready transition, not the frontend** —
see [Proxy & Auth](proxy-and-auth.md) for why, and for the new Tent
extension mechanism this requires.

- [Contracts](contracts.md) — the concrete routes and request/response
  shapes for Init, Submit, and the shared status-gate/Finalize endpoint.
- [Data Model & Migration](data-model-and-migration.md) — the `ready`
  column, its two-step migration rollout, and the filtering changes needed
  on existing read paths.
- [Proxy & Auth](proxy-and-auth.md) — the Tent extension mechanism, the new
  `proxy/` folder's agent ownership, session-cookie reuse, and upload
  validation.
- [Edge Cases & Coexistence](edge-cases-and-coexistence.md) — abandoned/duplicate
  upload handling, and how this flow coexists with the existing scan-job
  ingestion.

## Reference flow correction

Majora's own documentation includes a "pitfall" claiming Finalize is tested
but never called, so files never flip to `ready`. That turns out to be a
false reading of majora's own `unused-endpoints.md`: majora's Tent proxy
extension (`UploadHandler.php` + `UploadStatusClient.php`) actually calls
that same PATCH endpoint itself — once with `status=uploading` (to obtain
`file_path` before writing) and again with `status=uploaded` right after
writing the file, which is what flips the object to `ready`. The endpoint
only looks "unused" because majora's detection script only checks frontend
JS calling conventions and has no visibility into the proxy's own
PHP-to-backend calls.

## Out of scope

- Implementing any of the flow above (proxy rule, backend endpoints,
  frontend client) — that's #246/#247/#248.
- Deciding the scan-job deprecation timeline — that's #249.
- Writing the existing-photo-data migration plan and executing it — that's
  #250/#251.
- Actually creating the `proxy` agent config — that's #252.

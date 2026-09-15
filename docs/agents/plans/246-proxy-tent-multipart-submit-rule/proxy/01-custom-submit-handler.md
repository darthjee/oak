# Custom Submit request handler

Scaffold Tent's extension mechanism (new for Oak) and implement the handler that receives the `multipart/form-data` Submit request and drives it through validation, the pre-write authorization gate, the disk write, and Finalize.

Create the new top-level `proxy/` folder with a `loader.php` that `require_once`s the custom handler class(es), per `docs/agents/external/tent/extending-tent.md`. The handler class implements Tent's `RequestHandler` interface (mirror the shape of `DefaultProxyRequestHandler`/`ProxyRequestHandler`/`StaticFileHandler` from the vendored Tent source for the exact interface method(s) to implement — not documented in the how-to guide itself).

Handler responsibilities, in order (per `docs/agents/photo_upload/contracts.md` — "Submit" and `proxy-and-auth.md`):

1. Parse the incoming `multipart/form-data` body's single `file` field; extract the `:id` path segment from `/uploads/photos/:id/submit`.
2. Validate the file extension against an allow-list (`jpg`, `jpeg`, `png` — same list `CreateItemPhotosJob` uses) and against a max size read from the `OAK_PHOTO_MAX_UPLOAD_SIZE_BYTES` environment variable (see [03](03-docker-compose-env.md)). Reject (4xx, no backend call, no disk write) before doing anything else if either check fails.
3. Forward the incoming `Cookie` header and call the backend's status-gate endpoint, `PATCH /categories/:category_slug/items/:item_id/photos/:id.json` (exact category/item path segments TBD against #247's final route — the photo `:id` alone may not be enough to build this URL; coordinate with #247's actual implementation), with `{ status: "uploading" }`. On a non-2xx response (ownership/expired-session/already-ready), stop and relay the backend's status/body to the client without writing anything.
4. On success, the backend responds `{ file_path }`. Write the uploaded bytes to `<photos_path>/<file_path>` (read `photos_path` the same way the backend does — confirm whether this needs its own env var mirroring `Settings.photos_path`, since the proxy container doesn't share the Rails process).
5. Call the same status-gate endpoint again with `{ status: "ready" }` (Finalize).
6. Respond `200` to the frontend. The frontend never calls Finalize itself.

## Files to Change

- `proxy/extension/loader.php` — new; `require_once`s the handler class file(s) below.
- `proxy/extension/PhotoSubmitRequestHandler.php` (or similar; naming TBD against Tent's actual `RequestHandler` interface) — new; implements the six-step flow above.

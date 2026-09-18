# Create PhotoDeleteRequestHandler

Add `proxy/extension/PhotoDeleteRequestHandler.php`, a new `RequestHandler`
that mirrors `PhotoSubmitRequestHandler`'s shape and conventions (same
constructor/`build()` pattern, `HttpClientInterface` injection, path
parsing via a private regex constant, `errorResponse()` helper).

Matches `DELETE /uploads/categories/:category_slug/items/:item_id/photos/:id`
(no `/submit` suffix — see step 03 for the exact rule pattern).

`processsRequest()` flow:

1. Parse `category_slug`/`item_id`/`id` from the request path (404 if the
   pattern doesn't match — reuse the same `parsePath()` shape as Submit).
2. Forward the incoming `Cookie` header (same `headerValue()` helper as
   Submit).
3. `POST` the backend's `deletable.json` endpoint:
   `<host>/categories/<category_slug>/items/<item_id>/photos/<id>/deletable.json`.
   Relay the response as-is (status + body) if not a 2xx — this covers the
   backend's `422` (not ready), `403` (not owner), and redirect
   (not logged in) cases, matching Submit's `callGate()`/non-2xx relay
   pattern.
4. Extract `file_path` from the JSON body (same `extractFilePath()` shape
   as Submit — `502` if missing/malformed).
5. Resolve the destination via the `PhotoPathGuard` helper from step 01,
   **without creating any directories** (unlike Submit's write path — the
   directory should already exist for a `ready` photo; if it or the file
   don't exist, this is the "already missing" edge case, not an error).
6. If the resolved file exists on disk, `unlink()` it. If it does not
   exist (or the guard rejects the path as unsafe — same posture as
   Submit's post-guard failure), skip the delete silently and log it —
   per the issue's decided edge-case behavior, a missing file is a
   harmless no-op, not an error.
7. Only after the disk-delete step (or no-op) completes, call the backend
   `DELETE <host>/categories/<category_slug>/items/<item_id>/photos/<id>.json`
   (`Cookie` forwarded) to remove the row. This ordering (disk first, then
   DB row) is a decided edge case in the issue — a partial failure leaves
   an orphaned-but-harmless missing-file reference, never a dangling file
   with no owning row.
8. Relay the `DELETE` call's response if not 2xx; otherwise respond `200`
   to the frontend with an empty body (same `Response` shape as Submit's
   success response).

## Files to Change

- `proxy/extension/PhotoDeleteRequestHandler.php` (new) — the delete
  handler described above.

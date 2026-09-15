# Add PhotoUploadClient

Add a new client, `PhotoUploadClient`, that drives the Init → Submit steps of the photo upload flow for a single file. It does not extend `GenericClient` — `GenericClient`'s `post`/`patch` always send JSON (`Content-Type: application/json`), but Submit needs `multipart/form-data`, so this client talks to `fetch` directly, mirroring the role (not the internals) of majora's `UploadClient`.

Two low-level methods plus one orchestrating entry point:

- `init(categorySlug, itemId, fileName)` — `POST /categories/${categorySlug}/items/${itemId}/photos.json` with JSON body `{ photo: { file_name: fileName } }`. Returns the parsed body (`{ id, file_name, ready }`, per `Items::PhotosController#create`/`Oak::Photo::UploadDecorator`).
- `submit(categorySlug, itemId, photoId, file)` — `POST /uploads/categories/${categorySlug}/items/${itemId}/photos/${photoId}/submit`, `multipart/form-data`, single field `file` (built via `FormData`, `Content-Type` left for the browser to set with its boundary — do not set it manually). Throws on a non-`ok` response; resolves (no meaningful body needed) on success. **Does not call Finalize** — the proxy already has by the time this resolves.
- `upload(categorySlug, itemId, file)` — the entry point the controller calls: awaits `init()` to get the photo id, then `submit()`, then returns the `init()` result (the created photo). Lets the caller not know about the two-step sequence.

Forward the same session-auth affordances `GenericClient` already applies (`X-Skip-Cache` header when `isLoggedIn()` — reuse `../utils/authState.js`), since Init and Submit both need `require_user_for`/ownership checks to pass. Throw a plain `Error` on any non-`ok` response, matching `GenericClient`'s `#request` convention, so callers can use one `.catch()` shape.

## Files to Change

- `frontend/assets/js/client/PhotoUploadClient.js` — new file, per the shape above.

# Issue: Frontend — photo delete UI/client

## Problem

Parent issue: #261. The backend deletion endpoints (#262/#263) and the proxy delete route/handler (#264) already exist, but nothing in the frontend triggers a photo delete: there is no delete action wired up in the photo UI (`frontend/assets/js/components/elements/PhotoCarouselItem.jsx`, `frontend/assets/js/client/PhotoUploadClient.js`).

`PhotosCarousel`/`PhotoCarouselItem` are shared between two pages: the read-only item details page (`CategoryItemHelper`) and the item edit page (`CategoryItemEditHelper`). The delete action should be available on both, gated by the logged-in state each page already tracks (the `logged` prop on the details page; the edit page is only reachable while logged in).

## Solution

Add a `delete(categorySlug, itemId, photoId)` method to `PhotoUploadClient.js` that calls:

- `DELETE /uploads/categories/:category_slug/items/:item_id/photos/:id`

This mirrors the existing `init`/`submit` methods (same `X-Skip-Cache` header handling for logged-in users) rather than inlining the fetch call in a component. The proxy route responds `200` with an empty body on success and relays the backend status/body as-is on failure (see `proxy/extension/PhotoDeleteRequestHandler.php`); the client error handling should follow the same throw-on-non-ok-response pattern as `init`/`submit`.

Add a delete button to `PhotoCarouselItem`, rendered whenever a delete callback is passed down (so `PhotosCarousel`/`PhotoCarouselItem` stay usable without it), wired up on both the details page (`CategoryItemHelper`, gated by `logged`) and the edit page (`CategoryItemEditHelper`). Clicking it asks for confirmation via `window.confirm()` before calling the client method; there is no existing confirm/modal pattern in the frontend, so a native `confirm()` is the simplest fit for this one destructive action.

Track in-flight/error state per photo id, not a single shared flag, since the carousel can hold multiple photos: disable only the photo currently being deleted, and surface only its own error. On success, refetch the item the same way `CategoryItemEditController#uploadPhoto` already does after a successful upload (the details page controller will need equivalent refetch-after-mutation wiring), so the carousel reflects the removed photo without a full page reload.

## Dependency

The proxy delete route (#264) and backend deletion endpoints (#262/#263) have already landed, so this issue is no longer blocked: the request contract described above is live and can be verified end-to-end.

## Out of scope

- The backend `deletable.json`/`DELETE` endpoints (already implemented in #262/#263).
- The proxy delete route/handler (already implemented in #264).

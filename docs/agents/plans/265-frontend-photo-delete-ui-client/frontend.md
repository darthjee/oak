# Frontend Plan: Frontend — photo delete UI/client

Main plan: [plan.md](plan.md)

## Overview

`PhotoUploadClient.js` only drives Init/Submit today; there is no client
method or UI action for deleting a photo. The proxy delete route
(`DELETE /uploads/categories/:category_slug/items/:item_id/photos/:id`,
`proxy/extension/PhotoDeleteRequestHandler.php`) and the backend endpoints it
calls already exist and respond `200`/empty body on success, so this plan is
frontend-only.

## Context

- `PhotoCarouselItem.jsx` and `PhotosCarousel.jsx` are shared between the
  read-only item details page (`CategoryItemHelper` / `CategoryItem.jsx`,
  gated by the `logged` flag it already tracks) and the item edit page
  (`CategoryItemEditHelper` / `CategoryItemEdit.jsx`, only reachable while
  logged in). The delete button must work on both.
- `PhotoUploadClient.js`'s `init`/`submit` methods are the pattern to mirror:
  plain `fetch`, `X-Skip-Cache` header added via `#skipCacheHeader()` when
  logged in, and `throw new Error(...)` on a non-ok response.
- `CategoryItemEditController#uploadPhoto` is the pattern to mirror for the
  post-mutation refresh: call the client, then refetch the item
  (`#fetchItem`) and `setItem` the normalized result so the carousel updates
  without a full page reload.
- Photos carry an `id` field (see `Oak::Photo::Decorator` / the shape
  returned by `PhotoUploadClient#init`), which is what the delete route's
  `:id` segment and the `deletingPhotoId`/error-map keys below are keyed on.
- No confirm/modal component exists anywhere in the frontend yet; use a
  native `window.confirm()` inside `PhotoCarouselItem`'s click handler,
  before it calls the `onDelete` callback — callers (controllers/pages)
  should not need to know a confirmation happened.
- In-flight/error state must be tracked per photo id, not as a single shared
  flag, so deleting one photo does not disable the others: a single
  `deletingPhotoId` (only one delete in flight at a time is expected from
  the UI, but it must not block clicks on other photos) and a
  `deleteErrorByPhotoId` map (`{ [photoId]: message }`) keyed the same way.

## Steps

- [01 — Add delete() to PhotoUploadClient](frontend/01-add-delete-client-method.md)
- [02 — Add delete button to the photo carousel](frontend/02-add-delete-button-to-carousel.md)
- [03 — Wire delete into the edit page](frontend/03-wire-delete-into-edit-page.md)
- [04 — Wire delete into the details page](frontend/04-wire-delete-into-details-page.md)

## CI Checks

- `frontend`: `npm run coverage` (CI job: `jasmine`)
- `frontend`: `npm run lint` (CI job: `frontend-checks`)

## Notes

- Confirmation copy (e.g. "Delete this photo?") is not specified by the
  issue — pick reasonable wording, it is not user-facing-critical.
- The proxy relays the backend's status/body as-is on failure, so the client
  does not need to parse a specific error shape — `!response.ok` is enough.

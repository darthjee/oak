# Wire delete into the edit page

Add a `deletePhoto(item, photoId)` method to `CategoryItemEditController`,
mirroring `uploadPhoto`: resolve `slug`/`id` from the hash, set
`deletingPhotoId` (via a new `setDeletingPhotoId` setter passed into the
constructor, same style as `setUploading`), clear any prior error for that
photo, call `this.uploadClient.delete(slug, id, photoId)`, then on success
refetch the item (`#fetchItem`) and `setItem(this.#normalizeItem(...))`
exactly like `uploadPhoto` does; on failure, set a `deleteErrorByPhotoId`
entry for that photo id (via a new `setDeleteErrorByPhotoId` setter) instead
of a single shared error. Clear `deletingPhotoId` in `.finally()`.

Thread `deletingPhotoId`/`deleteErrorByPhotoId`/`onDeletePhoto` through
`CategoryItemEditHelper.render`/`#renderPhotoSection` down to
`PhotosCarousel`, and add the corresponding state + `onDeletePhoto` callback
in `CategoryItemEdit.jsx` (same pattern as `uploading`/`uploadError`/
`onUploadPhoto`).

## Files to Change

- `frontend/assets/js/components/pages/controllers/CategoryItemEditController.js`
  — add `setDeletingPhotoId`/`setDeleteErrorByPhotoId` constructor params and
  the `deletePhoto(item, photoId)` method described above.
- `frontend/assets/js/components/pages/helpers/CategoryItemEditHelper.jsx` —
  accept and forward `deletingPhotoId`, `deleteErrorByPhotoId`,
  `onDeletePhoto` through `render`/`#renderPhotoSection` to `PhotosCarousel`.
- `frontend/assets/js/components/pages/CategoryItemEdit.jsx` — add
  `deletingPhotoId`/`deleteErrorByPhotoId` state, pass the two new setters
  into the `CategoryItemEditController` constructor, add an `onDeletePhoto`
  callback calling `controller.deletePhoto(item, photoId)`, and pass all
  three through to `CategoryItemEditHelper.render`.
- `frontend/spec/components/pages/controllers/CategoryItemEditController_spec.js`
  — cover `deletePhoto`'s success (refetch + `setItem`) and failure
  (per-photo error set, `deletingPhotoId` cleared) paths.
- `frontend/spec/components/pages/helpers/CategoryItemEditHelper_spec.js` —
  cover the new props being forwarded to `PhotosCarousel`.
- `frontend/spec/components/pages/CategoryItemEdit_spec.js` — cover the new
  state wiring and `onDeletePhoto` callback.

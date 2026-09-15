# Wire upload into the item edit form

Wire `PhotoUploadClient` into the item edit page, gated to items that already have an `id` (see the plan's Notes — `CategoryItemEditHelper.render` is shared with the new-item page, which has none).

`CategoryItemEditController`:
- Add an `uploadPhoto(item, file)` method: resolves `slug`/`id` the same way `save()` does (`getCategoryItemEditParamsFromHash`), guards on `slug`/`id`/`file` the same way `save()` guards on `slug`/`id`/`item`, then calls `new PhotoUploadClient().upload(slug, id, file)` (constructed the same way `this.client` is — injectable via an optional constructor param, defaulting to `new PhotoUploadClient()`, for testability).
- Track upload state via two new setters passed in from the page component, `setUploading`/`setUploadError` (same shape as `setSaving`/`setError`), set/cleared around the call the same way `save()` does with `setSaving`/`setError`.
- On success, refetch the item (reuse the controller's existing `#fetchItem`-equivalent path, e.g. call `this.client.fetch(...)` for the item and push it through `setItem`) so the newly-uploaded (already-`ready`) photo appears without a full page reload.

`CategoryItemEdit.jsx`:
- Add `uploading`/`uploadError` state (`useState`), pass down to the helper alongside the existing props, and an `onUploadPhoto = (file) => controller.uploadPhoto(item, file)` handler.

`CategoryItemEditHelper.jsx`:
- Add a photo section, rendered only `if (item.id)`: a file input (accepting the same `%w[jpg jpeg png]` extensions the backend/proxy allow-list uses) plus an upload button (`disabled` while `uploading`, label swaps to `'Uploading...'` the same way `Save`/`'Saving...'` does), an error message reusing `ErrorContainer` when `uploadError` is set, and the existing `PhotosCarousel` element (`frontend/assets/js/components/elements/PhotosCarousel.jsx`) fed with `item.photos` to show what's already uploaded — the edit page doesn't render this today (only the show page does).

## Files to Change

- `frontend/assets/js/components/pages/controllers/CategoryItemEditController.js` — add `uploadPhoto`, `setUploading`/`setUploadError` wiring.
- `frontend/assets/js/components/pages/CategoryItemEdit.jsx` — add `uploading`/`uploadError` state and the upload handler, pass through to the helper.
- `frontend/assets/js/components/pages/helpers/CategoryItemEditHelper.jsx` — render the gated upload section (file input, button, error, `PhotosCarousel`).

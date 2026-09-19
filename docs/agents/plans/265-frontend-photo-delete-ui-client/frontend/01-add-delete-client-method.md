# Add delete() to PhotoUploadClient

Add a `delete(categorySlug, itemId, photoId)` method to `PhotoUploadClient`
that calls `DELETE /uploads/categories/:category_slug/items/:item_id/photos/:id`.
Mirror `init`/`submit`: plain `fetch` with `Accept: application/json` and
`this.#skipCacheHeader()` merged in, and `throw new Error(...)` when
`!response.ok`. The proxy responds `200` with an empty body on success, so
the method resolves with no value (unlike `init`, which returns JSON).

## Files to Change

- `frontend/assets/js/client/PhotoUploadClient.js` — add the `delete()`
  method, documented the same way as `init`/`submit` (JSDoc with
  `@param`/`@returns`/`@throws`).
- `frontend/spec/client/PhotoUploadClient_spec.js` — add specs covering a
  successful delete (correct URL/method/headers, resolves) and a failing one
  (`response.ok === false` throws).

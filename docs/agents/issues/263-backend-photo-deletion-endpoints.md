# Issue: Backend — photo deletion endpoints

## Problem

Parent issue: #261. Oak has no photo deletion flow — only Init, Submit,
and Finalize exist today for the photo upload lifecycle.

## Solution

Add two backend endpoints on `Items::PhotosController`, mirroring majora's
`deletable.json` → `DELETE` shape and Oak's existing Submit/status-gate
conventions:

- `POST /categories/:category_slug/items/:item_id/photos/:id/deletable.json`
  — pre-delete check. Verifies ownership (`photo.item.user == logged_user`,
  same as the existing checks), refuses if the photo isn't `ready: true`,
  and returns `{ file_path }` (same shape as the existing "uploading"
  status-gate check).
- `DELETE /categories/:category_slug/items/:item_id/photos/:id.json` —
  actual row removal. Ownership re-checked (defense in depth, mirrors
  Submit's double-check pattern).

Both are called by the proxy (a separate sub-issue, #262), never directly
by the frontend — same "proxy owns the transition calls" shape as
Submit/Finalize.

### Decided edge-case behavior

- Only `ready: true` photos can be deleted through this flow. `ready: false`
  (mid-upload/abandoned) rows are **not** handled here — a future flow will
  clear those separately (see the existing "abandoned uploads: no automatic
  cleanup for now" stance in `docs/agents/photo_upload/edge-cases-and-coexistence.md`).
- No `order`-column resequencing on delete — remaining photos keep their
  existing `order` values (gaps are fine).
- Deleting an already-deleted or nonexistent photo id returns `404`.

### Security

- `deletable.json` and `DELETE` both independently re-check
  `photo.item.user == logged_user`, same double-gate pattern Submit
  already uses. No new auth primitive or token needed — reuses
  session-cookie auth end-to-end like the rest of the upload flow.

### Out of scope

- Actually deleting the file from disk (proxy sub-issue, #262).
- The frontend trigger/UI for delete (frontend sub-issue, #264).
- Uniqueness fix on upload — separate sub-issue (#265).

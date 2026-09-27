# Issue: Proxy — /migrations/photos handler moving legacy files

## Description

Part of #251 (migrate legacy photo files to the new storage root). Legacy photos have been broken in production since #336 switched `OAK_PHOTOS_SERVER_URL`. Their `photos/` and `snaps/` files still use their legacy names, and the backend (Render) cannot see the Dreamhost disk. The proxy therefore does the file moves, and the backend authorizes and names each file (backend side delivered in #380).

On Dreamhost, `~/photos.oak.ffavs.net` is a symlink to `/home/darthjee_oak/photos/`, which is also the proxy's `storageRoot`. Legacy files already sit at `photos/users/<uid>/items/<item_id>/<file_name>` (and the `snaps/` equivalent) inside that root. Each migration is therefore a same-filesystem `rename()`, normally within the same item folder.

## Problem

There is no way to rename a user's legacy `photos/`/`snaps/` files to their new UUID-based names, so legacy photos keep resolving to files that do not exist under those names.

## Expected Behavior

`POST /migrations/photos?limit=N` (browser session cookie) migrates one batch of the logged-in user's legacy photos per call.

### Backend ↔ Proxy (as implemented in #380)

`POST /user/photos/migration/prepare?limit=N`: the proxy forwards the session cookie.

- `401` without a valid session.
- `limit` defaults to 10 and is clamped to `1..50` server-side.
- `200`:

```json
{
  "photos": [
    { "id": 17, "legacy_path": "users/3/items/42/abc.jpg", "file_path": "users/3/items/42/abc-<uuid>.jpg" }
  ],
  "remaining": 12
}
```

`legacy_path` = `users/<uid>/items/<item_id>/<file_name>`; `file_path` = `users/<uid>/items/<item_id>/<migration_file_name>`; `remaining` = the caller's `pending` + `migrating` count (before this batch).

`PATCH /user/photos/migration`: session cookie forwarded, JSON body:

```json
{ "migrated": [17], "missing": [18] }
```

Only the caller's rows currently in `migrating` are changed; unknown ids and other states are ignored (`migrated` wins over `missing`). Responds `200`.

### Proxy ↔ Frontend

- Any non-2xx response from `prepare` (`401`, …) is passed straight through.
- `200`:

```json
{ "migrated": 3, "missing": [18], "failed": [{ "id": 19, "reason": "rename failed" }], "remaining": 9 }
```

`remaining` is adjusted for this batch: photos just set to `migrated` or `missing` are subtracted.

- If the `PATCH` fails (non-2xx or transport error) after files were moved, the proxy responds `502`. Nothing is lost: the rows stay `migrating`, the backend lets them be claimed again after its timeout, and the next call resolves them through the "already moved" path.

## Solution

- New config entry `legacyRoot` (the root holding legacy `photos/` and `snaps/`), kept separate from `storageRoot` even though both currently point to the same place:
  - dev: `/tmp/photos` (same `./dev_public_files` mount as `storageRoot`);
  - prod: `$legacyRoot = '/home/darthjee_oak/photos';` in `locals.php.sample` (same as `$storageRoot`).
- Rule `POST /migrations/photos?limit=N` with a custom `RequestHandler` (following the existing `PhotoSubmit*`/`PhotoDelete*` handler + backend gateway pattern), registered in both the dev and prod configurations:
  1. Forwards the session cookie to the backend `prepare` call. **No file is touched unless it returns 2xx.** The handler acts only on paths returned by the backend; nothing path-related is taken from the incoming request.
  2. Validates each `legacy_path`/`file_path`, reusing/extending `PhotoPathGuard`: strict `users/<digits>/items/<digits>/` prefix; file-name segment non-empty with no `/`, no `..`, no NUL (legacy names may contain spaces/accents); no absolute paths. Invalid paths → `failed`, not moved.
  3. For each photo, pre-checks **both** `photos/` and `snaps/`. If either file is absent at both `legacyRoot/<kind>/<legacy_path>` and `storageRoot/<kind>/<file_path>`, the photo is `missing` and nothing is moved. Otherwise, per file:
     - present at the legacy path → `rename()` to the target (creating directories as needed; an existing target is simply overwritten);
     - absent at the legacy path but present at the target → already moved by an interrupted earlier call, counts as done.
  4. Classification: both files done → `migrated`; pre-check failure → `missing`; any other error (rename/mkdir) → `failed` (left `migrating` on the backend and claimable again after its timeout).
  5. Sends the backend `PATCH` with the `migrated`/`missing` ids, then responds to the client. The `PATCH` is **skipped** when both lists are empty (empty batch, or every photo `failed`). A `PATCH` failure → `502`.
- darthjee/tent-test PHPUnit specs with the backend stubbed: auth pass-through, path validation, full move, resume of an already-moved photo, partial legacy (one file) → missing, rename failure → failed, `PATCH` payload, `PATCH` skipped when empty, `PATCH` failure → 502, response shape; plus a prod routing assertion in `ProdConfigurationRoutingTest`.

### Out of scope

- Originals (`origin/`): not migrated; #335's delete already tolerates their absence.
- Frontend trigger/loop that calls `/migrations/photos` (handled by the frontend).
- Removing the legacy folder/vhost (manual) and, later, this handler (#379).

## Benefits

Legacy photos become servable again under their new names, one user-triggered batch at a time. The flow is resumable and idempotent, and it never touches files the backend did not authorize.

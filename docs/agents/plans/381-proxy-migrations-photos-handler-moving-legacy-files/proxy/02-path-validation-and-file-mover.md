# Path validation and file mover

**Path validation.** Add a strict shape check for migration paths. Either add a public method on `PhotoPathGuard` (e.g. `isValidPhotoPath(string $path): bool`), or add a small `PhotoMigrationPathValidator`. The check:

- matches `#^users/\d+/items/\d+/([^/]+)$#`;
- the file-name segment is non-empty, is not `.` or `..`, and contains no `..` and no NUL byte;
- rejects absolute paths (a leading `/` already fails the regex).

Spaces and accented characters must pass.

**`PhotoFileMover`** takes `legacyRoot`, `storageRoot` and a `PhotoPathGuard`. Its `migrate(string $legacyPath, string $filePath): string` returns one of `migrated`, `missing` or `failed:<reason>` (or a small value object/array with `status` and `reason`). It works over the kinds `['photos', 'snaps']`:

1. **Pre-check, every kind first.** For each kind, the file must exist at `legacyRoot/<kind>/<legacyPath>` or at `storageRoot/<kind>/<filePath>` (`is_file`). If any kind has neither → `missing`, and nothing is touched.
2. **Move, per kind.**
   - Legacy file present → create the target directory if needed (`mkdir` recursive, 0775; failure → `failed`, reason `mkdir failed`). Resolve both paths through `PhotoPathGuard::resolve()`; a `null` result → `failed`, reason `unsafe path`. Then `rename()`; `false` → `failed`, reason `rename failed`.
   - Legacy file absent but target present → already done.
3. All kinds done → `migrated`.

Log each failure with `error_log`, as `PhotoFileDeleter` does.

## Files to Change

- `proxy/extension/PhotoPathGuard.php` — add the path-shape validation (or a new validator file).
- `proxy/extension/PhotoFileMover.php` — new filesystem worker.
- `proxy/extension/loader.php` — `require_once` the new file(s).

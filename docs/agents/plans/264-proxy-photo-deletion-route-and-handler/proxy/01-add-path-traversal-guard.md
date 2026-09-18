# Add a shared path-traversal guard and retrofit PhotoSubmitRequestHandler

`PhotoSubmitRequestHandler::writeFile()` currently builds the destination
path by string concatenation (`$this->photosPath . '/' . ltrim($filePath, '/')`)
with no check that the result actually stays under `photosPath`. Even
though `file_path` is backend-computed today (not attacker-controlled),
add a defense-in-depth guard that resolves the real filesystem path and
confirms it is contained within `photosPath` before writing — and apply
the same guard in the new delete handler (step 02).

Since this logic is needed identically by both handlers, extract it into a
small shared helper rather than duplicating it — e.g. a `PhotoPathGuard`
class (or trait) in `proxy/extension/`, with a method like
`resolve(string $photosPath, string $filePath): ?string` that:

1. Builds the candidate destination (`rtrim($photosPath, '/') . '/' . ltrim($filePath, '/')`).
2. Resolves the real path of the destination's parent directory via
   `realpath()` (the directory may need to exist first — Submit's
   `writeFile()` already creates it with `mkdir(..., true)` before the
   guard runs; the delete handler must NOT create directories, see step 02).
3. Resolves the real path of `photosPath` itself.
4. Returns `null` if either `realpath()` call fails, or if the resolved
   directory does not start with the resolved root (guard against `..`
   segments or symlink escapes) — callers treat `null` as "reject/no-op",
   never write or unlink in that case.
5. Otherwise returns the resolved, safe absolute destination path.

Update `PhotoSubmitRequestHandler::writeFile()` to call this helper after
creating the destination directory, and to fail safely (e.g. skip the
move and let the caller respond with a 502-style error) if the guard
returns `null` — this should not normally trigger given today's
backend-computed paths, but must not silently write outside `photosPath`
if it ever does.

## Files to Change

- `proxy/extension/PhotoPathGuard.php` (new) — shared path-containment
  helper used by both Submit and Delete handlers.
- `proxy/extension/PhotoSubmitRequestHandler.php` — `writeFile()` now
  routes the destination through `PhotoPathGuard` before moving the
  uploaded file; add a safe-guard failure path (do not silently write
  outside `photosPath`).

# Extract PhotoVersionStorer

Create `Oak\Proxy\PhotoVersionStorer`, which owns writing the `origin/`, `photos/` and `snaps/` files:

- Constructor `(string $storageRoot, PhotoPathGuard $pathGuard, PhotoImageResizer $resizer)`; `rtrim($storageRoot, '/')`.
- Move the `ORIGIN_PREFIX` and `VERSIONS` constants here (keep their docblocks).
- `public function store(string $tmpName, string $filePath, string $photoId): ?string`: same logic as today's `storeVersions`. It returns `null` on success, or the client-facing error message (`'Failed to store uploaded file'` / `'Failed to resize uploaded file'`) on failure, after rolling back.
- Private `rollBack(array $written, string $photoId, string $filePath, string $step): void`: the unlink loop plus the **unchanged** `error_log` line (`PhotoSubmitRequestHandler: failed to write "%s" for photo %s, file_path "%s"; upload rolled back`). Keep the `PhotoSubmitRequestHandler:` prefix so logs stay identical.
- Private `destination` and `moveUpload`, moved as they are.

In `PhotoSubmitRequestHandler`:
- Replace the `$storageRoot`, `$pathGuard` and `$resizer` properties with `private PhotoVersionStorer $storer`, built as `new PhotoVersionStorer($storageRoot, new PhotoPathGuard(), new PhotoImageResizer())`.
- In `processsRequest`: `$storeError = $this->storer->store($file['tmp_name'], $filePath, $segments['id']);` and, when it isn't null, `return $this->errorResponse(502, $storeError);`.
- Remove `storeVersions`, `storeFailure`, `destination` and `moveUpload` from the handler, plus the constants that moved.
- Update the class docblock to say that steps 2/4 are delegated to `PhotoSubmitBackendGateway` and step 3 to `PhotoVersionStorer`.

## Files to Change
- `proxy/extension/PhotoVersionStorer.php`: new class
- `proxy/extension/PhotoSubmitRequestHandler.php`: delegate storage; remove the moved methods and constants; update the docblock

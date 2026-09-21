# Extract the photo file-deleter collaborator

`PhotoDeleteRequestHandler::deleteFile()` mixes disk-deletion orchestration (directory-exists check, `PhotoPathGuard` resolution, file-exists check, `unlink()`, and the three `error_log()` no-op cases) into the handler itself. Move it into its own collaborator, keeping the handler free of filesystem concerns — mirroring how `PhotoPathGuard` was already split out for path-safety.

```php
namespace Oak\Proxy;

class PhotoFileDeleter
{
    public function __construct(string $photosPath, PhotoPathGuard $pathGuard) { ... }

    /** Deletes <photosPath>/<filePath> if it exists; logs and no-ops otherwise. */
    public function delete(string $filePath): void { ... }
}
```

Move `deleteFile()`'s body verbatim into `PhotoFileDeleter::delete()` (renaming `$this->photosPath`/`$this->pathGuard` references to the new class's own constructor-injected properties). `PhotoDeleteRequestHandler` gets a `private PhotoFileDeleter $fileDeleter;`, constructed with the existing `$this->photosPath` and `$this->pathGuard`, and `processsRequest()` calls `$this->fileDeleter->delete($filePath)` instead of `$this->deleteFile($filePath)`.

## Files to Change
- `proxy/extension/PhotoFileDeleter.php` — new class with a `delete()` method, absorbing `PhotoDeleteRequestHandler::deleteFile()`'s body verbatim.
- `proxy/extension/PhotoDeleteRequestHandler.php` — construct `$this->fileDeleter` in `__construct()`, replace the `$this->deleteFile($filePath)` call in `processsRequest()` with `$this->fileDeleter->delete($filePath)`, and remove `deleteFile()`.

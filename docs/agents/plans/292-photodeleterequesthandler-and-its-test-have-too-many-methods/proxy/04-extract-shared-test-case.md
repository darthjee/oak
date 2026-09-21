# Extract a shared base test case for both handler tests

`PhotoDeleteRequestHandlerTest` and `PhotoSubmitRequestHandlerTest` each define an identical `removeDirRecursive()` helper, and near-identical `setUp()`/`tearDown()` pairs that create a per-test temp `photosPath` directory (differing only in the `uniqid()` prefix string) and remove it afterward. Extract this into a shared abstract base test case both classes extend instead of `PHPUnit\Framework\TestCase` directly.

```php
namespace Oak\Proxy\Tests;

use PHPUnit\Framework\TestCase;

abstract class PhotoRequestHandlerTestCase extends TestCase
{
    protected string $photosPath;

    protected function setUp(): void
    {
        parent::setUp();
        $this->photosPath = sys_get_temp_dir() . '/' . $this->tempDirPrefix() . uniqid();
        mkdir($this->photosPath, 0775, true);
    }

    protected function tearDown(): void
    {
        $this->removeDirRecursive($this->photosPath);
        parent::tearDown();
    }

    abstract protected function tempDirPrefix(): string;

    protected function removeDirRecursive(string $dir): void { ... }
}
```

`removeDirRecursive()`'s body moves verbatim from either existing test class (they're identical). Each concrete test class implements `tempDirPrefix()` to preserve its current prefix (`'photo_delete_test_'` / `'photo_submit_test_'`) and drops its own `setUp()`, `tearDown()`, and `removeDirRecursive()` — everything else (test methods, `buildHandler()`, `buildRequest()`, `writeExistingFile()`, `buildUploadedFile()`) stays as-is.

## Files to Change
- `proxy/extension_tests/PhotoRequestHandlerTestCase.php` — new abstract base class with `setUp()`, `tearDown()`, `removeDirRecursive()`, and the `tempDirPrefix()` abstract hook.
- `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php` — extend `PhotoRequestHandlerTestCase`, implement `tempDirPrefix()` returning `'photo_delete_test_'`, remove its own `setUp()`, `tearDown()`, `removeDirRecursive()`.
- `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php` — extend `PhotoRequestHandlerTestCase`, implement `tempDirPrefix()` returning `'photo_submit_test_'`, remove its own `setUp()`, `tearDown()`, `removeDirRecursive()`.

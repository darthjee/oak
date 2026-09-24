# Add PhotoImageResizerTestCase
Create an abstract base class holding the shared fixture for the resizer tests, following the style of `PhotoSubmitRequestHandlerTestCase` (docblock on the class, `require_once` of `PhotoRequestHandlerTestCase.php`, namespace `Oak\Proxy\Tests`).

- `abstract class PhotoImageResizerTestCase extends PhotoRequestHandlerTestCase`
- `protected PhotoImageResizer $resizer;`
- `protected function setUp(): void` — calls `parent::setUp()` then `$this->resizer = new PhotoImageResizer();`
- Leaves `tempDirPrefix()` abstract (inherited) so each concrete class supplies its own prefix.

## Files to Change
- `proxy/extension_tests/PhotoImageResizerTestCase.php` — new abstract base class.

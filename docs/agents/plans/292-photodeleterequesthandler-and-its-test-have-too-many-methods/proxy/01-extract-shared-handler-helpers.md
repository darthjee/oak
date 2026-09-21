# Extract shared handler helpers into a trait

`PhotoDeleteRequestHandler` and `PhotoSubmitRequestHandler` each define their own private `headerValue()`, `extractFilePath()`, and `errorResponse()` — all three are byte-for-byte identical between the two classes today. Move them into a new trait and `use` it in both handlers, deleting the duplicated method bodies from each class.

Since both handlers already extend the vendored `Tent\RequestHandlers\RequestHandler`, a trait (not a shared abstract base class) is the only option that doesn't disturb that inheritance.

```php
namespace Oak\Proxy;

use Tent\Models\RequestInterface;
use Tent\Models\Response;

trait PhotoRequestHandlerHelpers
{
    private function headerValue(RequestInterface $request, string $name): ?string { ... }
    private function extractFilePath(string $body): ?string { ... }
    private function errorResponse(int $httpCode, string $message): Response { ... }
}
```

Keep each method's existing docblock and behavior unchanged — this is a pure move, not a rewrite.

## Files to Change
- `proxy/extension/PhotoRequestHandlerHelpers.php` — new trait holding `headerValue()`, `extractFilePath()`, and `errorResponse()`, moved verbatim from `PhotoDeleteRequestHandler`.
- `proxy/extension/PhotoDeleteRequestHandler.php` — `use PhotoRequestHandlerHelpers;`, remove its own `headerValue()`, `extractFilePath()`, `errorResponse()`.
- `proxy/extension/PhotoSubmitRequestHandler.php` — `use PhotoRequestHandlerHelpers;`, remove its own `headerValue()`, `extractFilePath()`, `errorResponse()`.

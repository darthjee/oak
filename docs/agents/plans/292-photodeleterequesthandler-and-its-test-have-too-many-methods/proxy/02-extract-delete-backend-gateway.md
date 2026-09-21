# Extract the delete backend-gateway collaborator

`PhotoDeleteRequestHandler` currently builds both backend URLs (`deletableUrl()`, `deleteUrl()`) and makes both outbound calls (`callBackend()`) itself. Extract this into a small collaborator so the handler only orchestrates the flow (parse path → ask the gateway if deletable → delete the file → tell the gateway to delete the row → respond).

```php
namespace Oak\Proxy;

use Tent\Http\HttpClientInterface;
use Tent\Models\Response;

class PhotoDeleteBackendGateway
{
    public function __construct(string $host, HttpClientInterface $httpClient) { ... }

    /** Calls the deletable.json gate; forwards $cookie if present. */
    public function checkDeletable(array $segments, ?string $cookie): Response { ... }

    /** Calls the backend row-delete endpoint; forwards $cookie if present. */
    public function deleteRow(array $segments, ?string $cookie): Response { ... }
}
```

`checkDeletable()`/`deleteRow()` absorb today's `deletableUrl()`/`deleteUrl()` URL-building plus the shared `callBackend()` request logic (method + optional `Cookie` header). `PhotoDeleteRequestHandler` gets a `private PhotoDeleteBackendGateway $gateway;` set up alongside `$this->pathGuard` in its constructor, and `processsRequest()` calls `$this->gateway->checkDeletable($segments, $cookie)` / `$this->gateway->deleteRow($segments, $cookie)` instead of building URLs and calling `callBackend()` itself.

## Files to Change
- `proxy/extension/PhotoDeleteBackendGateway.php` — new class with `checkDeletable()` and `deleteRow()`, absorbing `deletableUrl()`, `deleteUrl()`, and `callBackend()`.
- `proxy/extension/PhotoDeleteRequestHandler.php` — construct `$this->gateway` in `__construct()`, replace the `deletableResponse`/`deleteResponse` call sites in `processsRequest()` to go through the gateway, and remove `deletableUrl()`, `deleteUrl()`, `callBackend()`.

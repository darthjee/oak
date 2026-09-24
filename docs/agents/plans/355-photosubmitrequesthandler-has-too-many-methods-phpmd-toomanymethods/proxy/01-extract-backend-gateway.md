# Extract PhotoSubmitBackendGateway

Create `Oak\Proxy\PhotoSubmitBackendGateway`, modelled on `PhotoDeleteBackendGateway`:

- Constructor `(string $host, HttpClientInterface $httpClient)`; `rtrim($host, '/')`.
- `public function markUploading(array $segments, ?string $cookie): Response`: the pre-write status gate (`PATCH { "status": "uploading" }`).
- `public function markReady(array $segments, ?string $cookie): Response`: Finalize (`PATCH { "status": "ready" }`).
- Private `gateUrl(array $segments): string` (`%s/categories/%s/items/%s/photos/%s.json`) and `callGate(string $url, string $status, ?string $cookie): Response`, moved as they are from the handler (`Content-Type: application/json`; add `Cookie` only when it isn't null).

In `PhotoSubmitRequestHandler`:
- Replace the `$host` and `$httpClient` properties with `private PhotoSubmitBackendGateway $gateway`, built in the constructor as `new PhotoSubmitBackendGateway($host, $httpClient ?? new CurlHttpClient())`.
- In `processsRequest`, call `$this->gateway->markUploading($segments, $cookie)` and `->markReady(...)` instead of `callGate` with a pre-built URL. Remove `gateUrl` and `callGate` from the handler.

## Files to Change
- `proxy/extension/PhotoSubmitBackendGateway.php`: new class
- `proxy/extension/PhotoSubmitRequestHandler.php`: delegate the gate calls; remove `gateUrl`/`callGate`

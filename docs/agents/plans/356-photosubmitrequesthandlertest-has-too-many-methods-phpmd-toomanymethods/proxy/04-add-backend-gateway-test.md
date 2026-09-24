# Add PhotoSubmitBackendGatewayTest
Unit-test `PhotoSubmitBackendGateway` with `FakeHttpClient`. It needs no filesystem, so extend `PHPUnit\Framework\TestCase` directly. Build it with `new PhotoSubmitBackendGateway('http://backend:3000/', $httpClient)` (a trailing slash checks that the host gets trimmed). Use segments `['category_slug' => 'miniatures', 'item_id' => '42', 'id' => '7']`.

Cases:
- `markUploading` sends one `PATCH` to `http://backend:3000/categories/miniatures/items/42/photos/7.json` with body `{"status":"uploading"}` and a `Content-Type: application/json` header;
- `markReady` sends the same URL with body `{"status":"ready"}`;
- a cookie is forwarded as the `Cookie` header when given, and no `Cookie` header is sent when it is `null`;
- the backend response is returned as is: queue e.g. `['body' => '{"error":"forbidden"}', 'httpCode' => 403, 'headers' => []]` and assert on `httpCode()` / `body()`.

## Files to Change
- `proxy/extension_tests/PhotoSubmitBackendGatewayTest.php` — new unit test for `PhotoSubmitBackendGateway`.

# Add PhotoDeleteBackendGatewayTest
Unit-test `PhotoDeleteBackendGateway`, following `PhotoSubmitBackendGatewayTest` (extends plain `TestCase`, `FakeHttpClient`, `SEGMENTS = ['category_slug' => 'miniatures', 'item_id' => '42', 'id' => '7']`, a private `buildGateway` helper). Tests:
- `checkDeletable` POSTs to `http://backend:3000/categories/miniatures/items/42/photos/7/deletable.json`;
- `deleteRow` DELETEs `http://backend:3000/categories/miniatures/items/42/photos/7.json`;
- a given cookie is forwarded as the `Cookie` header;
- no cookie → no `Cookie` header sent;
- the backend's status code and body are relayed in the returned `Response`.

Also cover host trailing-slash trimming if cheap (e.g. build with `http://backend:3000/`).

## Files to Change
- `proxy/extension_tests/PhotoDeleteBackendGatewayTest.php` — new test class.

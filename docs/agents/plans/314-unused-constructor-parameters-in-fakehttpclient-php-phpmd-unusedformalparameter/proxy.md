# Proxy Plan: Unused constructor parameters in FakeHttpClient.php (PHPMD UnusedFormalParameter)

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Record `uploadedFiles`/`postFields` in `FakeHttpClient::request()`

In `proxy/extension_tests/FakeHttpClient.php`, add `'uploadedFiles' => $uploadedFiles` and `'postFields' => $postFields` to the associative array pushed onto `$this->calls`, alongside the existing `method`/`url`/`headers`/`body` keys. This uses both parameters (satisfying PHPMD's `UnusedFormalParameter`) without touching the method signature, so `HttpClientInterface` compliance and every existing caller are unaffected.

### Step 2 — Add test coverage for the recorded fields

Note: neither existing caller passes non-default values for these params today — `PhotoSubmitRequestHandler::callGate()` and `PhotoDeleteBackendGateway`'s call both use `$httpClient->request()` with 3–4 args and rely on the `[]` defaults for `uploadedFiles`/`postFields`. Routing coverage through a request handler would therefore not actually exercise non-default values. Instead, add a new, focused unit test that exercises `FakeHttpClient` directly: `proxy/extension_tests/FakeHttpClientTest.php`, constructing a `FakeHttpClient`, calling `->request()` with non-empty `$uploadedFiles` and `$postFields` arrays, and asserting `$httpClient->calls[0]['uploadedFiles']` / `['postFields']` equal what was passed in (plus a case confirming the existing default-`[]` behavior still recorded correctly, to guard against a future regression).

## Files to Change

- `proxy/extension_tests/FakeHttpClient.php` — record `uploadedFiles`/`postFields` into `$this->calls`.
- `proxy/extension_tests/FakeHttpClientTest.php` (new) — direct unit test asserting both fields are recorded correctly for non-default and default values.

## CI Checks

- `proxy`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`, `.circleci/config.yml`) — runs `vendor/bin/phpunit` against `proxy/extension` + `proxy/extension_tests` inside the `darthjee/tent-test` image.

## Notes

- Confirm PHPMD's Codacy analysis re-runs clean against `FakeHttpClient.php` line 31/32 after the change (no local PHPMD config is bundled in `darthjee/tent-test` per `docs/agents/external/tent/extending-tent.md`, so this is verified via CI/Codacy rather than a local lint command).

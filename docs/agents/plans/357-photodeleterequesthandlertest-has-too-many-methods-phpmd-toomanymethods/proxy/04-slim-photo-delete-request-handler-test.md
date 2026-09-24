# Slim PhotoDeleteRequestHandlerTest
Make `PhotoDeleteRequestHandlerTest` extend `PhotoDeleteRequestHandlerTestCase`, remove its now-inherited constants, setUp/tearDown and private helpers, and keep only the orchestration cases:
- happy path: gate POST then row DELETE (methods + URLs asserted), all versions gone;
- non-successful gate (422) relayed (status + body), one backend call, nothing deleted;
- forbidden gate (403) relayed, one backend call, nothing deleted;
- failed backend DELETE (404) relayed, two calls, files already gone (keep the disk-first ordering comment).

Remove the already-missing, partial-versions, path-escape and cookie-forwarding tests — they are now covered by `PhotoFileDeleterTest` and `PhotoDeleteBackendGatewayTest`. The class should end up with `tempDirPrefix` + 4 tests (5 methods). Run `docker compose run --rm extension_tests` to confirm everything passes.

## Files to Change
- `proxy/extension_tests/PhotoDeleteRequestHandlerTest.php` — extend the new base, drop helpers and redundant tests.

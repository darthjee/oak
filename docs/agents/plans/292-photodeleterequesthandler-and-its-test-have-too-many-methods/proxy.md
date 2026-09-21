# Proxy Plan: PhotoDeleteRequestHandler and its test have too many methods

Main plan: [plan.md](plan.md)

## Steps

- [01 — Extract shared handler helpers into a trait](proxy/01-extract-shared-handler-helpers.md)
- [02 — Extract the delete backend-gateway collaborator](proxy/02-extract-delete-backend-gateway.md)
- [03 — Extract the photo file-deleter collaborator](proxy/03-extract-photo-file-deleter.md)
- [04 — Extract a shared base test case for both handler tests](proxy/04-extract-shared-test-case.md)
- [05 — Verify method counts and split the test further only if still needed](proxy/05-verify-method-counts.md)

## CI Checks
- `proxy`: `vendor/bin/phpunit` (from the `darthjee/tent-test` image, working directory `/home/app/app`) (CI job: `proxy-tests`)

## Notes
- `PhotoDeleteRequestHandler` and `PhotoSubmitRequestHandler` both extend the vendored `Tent\RequestHandlers\RequestHandler` (not present in this repo), so shared behavior between them must be a **trait**, not a common base class — PHP doesn't allow using both an external base class and a second shared parent.
- `headerValue()`, `extractFilePath()`, and `errorResponse()` are byte-for-byte identical between the two handlers today — verify that stays true while extracting the trait; if either has drifted, keep the higher-fidelity version and update the other handler's call sites accordingly.
- `PhotoPathGuard` has no dedicated test file of its own — it's exercised indirectly through the handler tests. Follow the same convention for the new `PhotoDeleteBackendGateway`/`PhotoFileDeleter` collaborators: no new standalone test files, keep coverage through `PhotoDeleteRequestHandlerTest`.
- Do not change `PhotoDeleteRequestHandler`'s public constructor signature (`host`, `photosPath`, `?HttpClientInterface`) or its `build()` factory shape — only its private internals move to collaborators.

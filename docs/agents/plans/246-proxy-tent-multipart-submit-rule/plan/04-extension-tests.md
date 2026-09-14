# Extension tests

Add PHPUnit coverage for the custom handler using the `darthjee/tent-test` image and its bundled test-support helpers (`DummyRequestMiddleware`, `QuickResponseMiddleware`, `DummyResponseMiddleware`, `FileSystemUtils`, `RequestToBodyHandler` — see `docs/agents/external/tent/extending-tent.md` → "Testing your extension"), covering at minimum:

- Extension validation rejects a disallowed extension without calling the backend or writing a file.
- Oversized upload is rejected without calling the backend or writing a file.
- A non-2xx response from the `{ status: "uploading" }` gate call stops the flow before any write.
- Happy path: gate call → file written to the returned `file_path` → `{ status: "ready" }` call → 200 response.

Wire a new CircleCI job (no existing job tests proxy config — `upload_proxy_files` only deploys it on release) so this coverage actually runs in CI, required by `build-and-release` the same way `test`/`checks`/`jasmine`/`frontend-checks` are.

## Files to Change

- `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php` (naming TBD to match the class from [01](01-custom-submit-handler.md)) — new PHPUnit test class.
- `.circleci/config.yml` — new `proxy-tests` job (`darthjee/tent-test` image, mounting `./proxy/extension` and `./proxy/extension_tests` the same way the doc's `docker compose run --rm extension_tests` example does, or the container-run form) added to the `test` workflow and to `build-and-release`'s `requires:` list.

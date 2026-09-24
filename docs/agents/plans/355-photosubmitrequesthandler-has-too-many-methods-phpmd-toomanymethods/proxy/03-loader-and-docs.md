# Wire up loader and update docs

- In `proxy/extension/loader.php`, add `require_once` lines for `PhotoSubmitBackendGateway.php` and `PhotoVersionStorer.php` **before** `PhotoSubmitRequestHandler.php`, and after `PhotoPathGuard.php` / `PhotoImageResizer.php` (the storer depends on them).
- In `docs/agents/specs/photo/resizing.md` ("Submit sequence"), say that `PhotoSubmitRequestHandler` delegates the status-gate/Finalize calls to `PhotoSubmitBackendGateway` and the three writes to `PhotoVersionStorer`. Check `proxy-rules.md` and `examples.md` too: they only reference the handler class in the rules, which doesn't change, so no edit is expected there.
- Run `docker compose run --rm extension_tests` and confirm it passes.

## Files to Change
- `proxy/extension/loader.php`: require the two new classes
- `docs/agents/specs/photo/resizing.md`: describe the new collaborators

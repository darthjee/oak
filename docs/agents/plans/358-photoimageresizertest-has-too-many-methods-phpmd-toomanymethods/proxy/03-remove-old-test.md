# Remove PhotoImageResizerTest
Delete the original class once all 11 tests live in the new files, then run `docker compose run --rm extension_tests` and confirm the same 11 resizer tests pass.

## Files to Change
- `proxy/extension_tests/PhotoImageResizerTest.php` — deleted.

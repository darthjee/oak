# Proxy Plan: PhotoDeleteRequestHandler.php: replace `!` comparisons with strict boolean checks

Main plan: [plan.md](plan.md)

## Implementation Steps

### Step 1 — Replace `!` negations with explicit `=== FALSE` comparisons

In `proxy/extension/PhotoDeleteRequestHandler.php`, rewrite the 5 conditions PHPCS flagged (`Squiz.Operators.ComparisonOperatorUsage`, ErrorProne) so each negation is an explicit `=== FALSE` comparison instead of a leading `!`. No behavioral change — each rewritten condition must evaluate identically to the original for every input.

- line 106: `if (!$deletableResponse->isSuccessful()) {` → `if ($deletableResponse->isSuccessful() === FALSE) {`
- line 120: `if (!$deleteResponse->isSuccessful()) {` → `if ($deleteResponse->isSuccessful() === FALSE) {`
- line 235: `if (!is_array($decoded) || !isset($decoded['file_path']) || !is_string($decoded['file_path'])) {` → `if (is_array($decoded) === FALSE || isset($decoded['file_path']) === FALSE || is_string($decoded['file_path']) === FALSE) {`
- line 257: `if (!is_dir($destinationDir)) {` → `if (is_dir($destinationDir) === FALSE) {`
- line 279: `if (!file_exists($safeDestination)) {` → `if (file_exists($safeDestination) === FALSE) {`

## Files to Change
- `proxy/extension/PhotoDeleteRequestHandler.php` — replace the 5 `!`-negated conditions listed above with `=== FALSE` comparisons.

## CI Checks
- `proxy/extension`: `vendor/bin/phpunit` (CI job: `proxy-tests`) — existing `proxy/extension_tests` PHPUnit specs for this handler must still pass unchanged, since behavior is not changing.

## Notes
- Purely a style/lint fix driven by a Codacy finding; no test additions are expected since behavior is unchanged.

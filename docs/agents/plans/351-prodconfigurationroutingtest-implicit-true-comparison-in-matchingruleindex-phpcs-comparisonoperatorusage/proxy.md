# Proxy Plan: ProdConfigurationRoutingTest: implicit true comparison in matchingRuleIndex (PHPCS ComparisonOperatorUsage)

Main plan: [plan.md](plan.md)

## Overview
Replace the implicit truthiness check in `matchingRuleIndex()` with a strict `=== true` comparison. The behaviour stays the same.

## Context
Codacy reports `PHPCS_Squiz_Operators_ComparisonOperatorUsage` on `if ($rule->match($request)) {` in `matchingRuleIndex()`. The report says line 140; the line is now 153 after #364. `Tent\Rule::match(RequestInterface $request): bool` is declared to return `bool` (checked against the Tent source), so `=== true` is equivalent to the current check.

## Implementation Steps

### Step 1 — Use an explicit boolean comparison in `matchingRuleIndex()`
In `ProdConfigurationRoutingTest::matchingRuleIndex()`, change:

```php
if ($rule->match($request)) {
```

to:

```php
if ($rule->match($request) === true) {
```

Do not change anything else in the file. If #352 has already moved `matchingRuleIndex()` into another file (for example a helper trait under `proxy/extension_tests/`), make the same change at its new location.

## Files to Change
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` — explicit `=== true` in `matchingRuleIndex()`

## CI Checks
- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`, PHPUnit on `darthjee/tent-test:1.0.0`)

## Notes
- No behaviour change is expected, because `match()` is typed `: bool`.
- #352 refactors the same test class. Whichever issue lands second may need a trivial rebase.

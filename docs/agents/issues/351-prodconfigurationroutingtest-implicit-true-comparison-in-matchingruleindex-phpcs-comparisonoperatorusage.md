# Issue: ProdConfigurationRoutingTest: implicit true comparison in matchingRuleIndex (PHPCS ComparisonOperatorUsage)

## Description
Codacy flags an implicit truthiness check in the `matchingRuleIndex()` helper of `proxy/extension_tests/ProdConfigurationRoutingTest.php`. The fix is a one-line change inside the proxy test suite, owned by the `proxy` agent.

## Problem
Codacy finding:

- `proxy/extension_tests/ProdConfigurationRoutingTest.php` (reported at line 140; now line 153 after #364): PHP_CodeSniffer `PHPCS_Squiz_Operators_ComparisonOperatorUsage` (ErrorProne, Warning): Implicit true comparisons prohibited; use === TRUE instead
  `if ($rule->match($request)) {`
  https://app.codacy.com/p/681941/issues/index?resultDataId=131541688839

`matchingRuleIndex()` checks `if ($rule->match($request))`, but the Squiz sniff requires an explicit boolean comparison.

## Expected Behavior
- `matchingRuleIndex()` uses an explicit comparison, and Codacy no longer reports the finding.
- `docker compose run --rm extension_tests` (PHPUnit on `darthjee/tent-test`) still passes.
- No behaviour change: the helper still returns the index of the first matching rule, or `null`.

## Solution
Change the condition to `if ($rule->match($request) === true)`. Before making the change, confirm that `Tent\Rule::match()` returns a strict `bool`. If it can return a truthy non-bool, `=== true` would change behaviour, and the finding should be marked as a false positive instead.

This can be done on its own. If #352 (the refactor that moves assertion helpers out of `ProdConfigurationRoutingTest`) is implemented first or at the same time, apply the same change wherever `matchingRuleIndex()` ends up.

## Benefits
- Clears one Codacy ErrorProne warning.
- Keeps the proxy test suite consistent with the Squiz explicit-comparison rule.

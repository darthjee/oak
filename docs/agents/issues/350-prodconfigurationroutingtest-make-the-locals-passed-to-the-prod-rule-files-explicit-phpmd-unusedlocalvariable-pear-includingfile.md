# Issue: ProdConfigurationRoutingTest: make the locals passed to the prod rule files explicit (PHPMD UnusedLocalVariable + PEAR IncludingFile)

## Description
`ProdConfigurationRoutingTest::loadProdRules()` (`proxy/extension_tests/ProdConfigurationRoutingTest.php`) stands in for the server-only `locals.php`: it sets `$backendHost`, `$staticRoot`, `$storageRoot` and `$maxUploadSizeBytes` as locals, then `require`s the six rule files from `proxy/prod_configuration/rules/` in the same order as `proxy/prod_configuration/configure.php`. The rule files read those variables from the enclosing scope.

## Problem
Codacy reports 10 findings on this method:

- PHPMD `UnusedLocalVariable` (lines 120–123) for `$backendHost`, `$staticRoot`, `$storageRoot`, `$maxUploadSizeBytes`. PHPMD cannot see that the required files consume them.
- PHPCS `PEAR.Files.IncludingFile` (lines 127–132) for the six `require $configDir . '/rules/<name>.php'` statements, since they are inside a method (treated as conditional includes).

The code works; the implicit coupling through local scope is what triggers both findings.

## Expected Behavior
- Codacy no longer reports the findings above (any that can't be removed cleanly are marked as false positives in Codacy with a short justification).
- `docker compose run --rm extension_tests` (PHPUnit on `darthjee/tent-test`) still passes.
- No behaviour change: same rules registered, same order as `configure.php` (frontend, photos, uploads, deletes, backend, redirects), same assertions.
- Scope is limited to the test file; `proxy/prod_configuration/` is not changed.

## Solution
Make the hand-off explicit so the variables are visibly used and the include happens in one place:

- Keep the stand-in values in a single array of locals (built from the existing class constants) instead of four loose local variables.
- Keep the ordered list of rule file names in a constant (mirroring `configure.php`).
- Add a small private helper, e.g. `includeRuleFile(string $file, array $locals)`, that:
  1. calls `$this->assertFileExists($path)` so a missing rule file still fails loudly;
  2. calls `extract($locals)`;
  3. loads the file with `include` (not `require`), which is what the PEAR sniff asks for.
- `loadProdRules()` loops over the constant and calls the helper for each file.

If a finding can't be removed cleanly, mark it as a false positive in Codacy with a justification.

## Benefits
- Clears 10 Codacy findings on the proxy test suite.
- The data the rule files depend on is declared in one explicit place, making the contract with `locals.php` easier to read and maintain.

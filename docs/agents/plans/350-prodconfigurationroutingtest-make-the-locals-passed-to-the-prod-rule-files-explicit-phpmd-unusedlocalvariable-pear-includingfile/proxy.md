# Proxy Plan: ProdConfigurationRoutingTest: make the locals passed to the prod rule files explicit (PHPMD UnusedLocalVariable + PEAR IncludingFile)

Main plan: [plan.md](plan.md)

## Overview
Replace the four loose local variables and the six in-method `require` statements in `ProdConfigurationRoutingTest::loadProdRules()` with an explicit locals array, an ordered rule-file constant and a single `includeRuleFile()` helper. This clears the PHPMD `UnusedLocalVariable` and PHPCS `PEAR.Files.IncludingFile` findings reported by Codacy, with no behaviour change.

## Context
- The production `configure.php` loads the server-only `locals.php` (which defines `$backendHost`, `$staticRoot`, `$storageRoot`, `$maxUploadSizeBytes`) and then `require_once`s the rule files in this order: `frontend`, `photos`, `uploads`, `deletes`, `backend`, `redirects`.
- The rule files in `proxy/prod_configuration/rules/` read those variables from the enclosing scope (for example, `uploads.php` uses `$backendHost`, `$storageRoot` and `$maxUploadSizeBytes`).
- The test cannot load `configure.php` (there is no `locals.php`), so it sets the locals inline. PHPMD can't see that the included files use them, and PEAR flags `require` inside a method.
- Decisions from the issue discussion: load each file with `include` (not `require`), guarded by `assertFileExists` so a missing file still fails loudly; pass the locals with `extract()` inside the helper.

## Implementation Steps

### Step 1 — Introduce the rule-file constant and the include helper
In `ProdConfigurationRoutingTest`:
- Add a private constant listing the rule file base names in `configure.php` order, e.g.
  `private const RULE_FILES = ['frontend', 'photos', 'uploads', 'deletes', 'backend', 'redirects'];`
- Add a private helper:
  ```php
  private function includeRuleFile(string $path, array $locals): void
  {
      $this->assertFileExists($path);

      extract($locals);

      include $path;
  }
  ```
  `include` runs in the helper's scope, so the extracted variables are visible to the rule file exactly as the locals were before.

### Step 2 — Rewrite `loadProdRules()` to use the helper
- Build the locals once as an array keyed by the variable names the rule files expect:
  ```php
  // Stand-ins for the server-only locals.php, consumed by the rule files.
  $locals = [
      'backendHost'        => self::BACKEND_HOST,
      'staticRoot'         => self::STATIC_ROOT,
      'storageRoot'        => self::STORAGE_ROOT,
      'maxUploadSizeBytes' => self::MAX_UPLOAD_SIZE_BYTES,
  ];
  ```
- Keep `$configDir = dirname(__DIR__, 2) . '/prod_configuration';`.
- Loop over `self::RULE_FILES` and call `$this->includeRuleFile($configDir . '/rules/' . $file . '.php', $locals);`.
- Remove the four loose locals and the six `require` lines.
- Update the class docblock ("requires the rule files") to say the rule files are included through the helper, in `configure.php` order.

The assertions in `testProdRulesRouteRequestsInOrder()` stay unchanged. They check that 9 rules are registered in the expected order, which guards against any ordering regression.

## Files to Change
- `proxy/extension_tests/ProdConfigurationRoutingTest.php`: add the `RULE_FILES` constant and the `includeRuleFile()` helper, rewrite `loadProdRules()`, and adjust the class docblock.

## CI Checks
- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`, which runs `vendor/bin/phpunit` on `darthjee/tent-test:1.0.0`)

## Notes
- No changes to `proxy/prod_configuration/`. The rule list in the test must stay in sync with `configure.php` by hand, the same as today.
- The `assertFileExists` call adds 6 assertions to the test count, which is harmless.
- If Codacy then flags `extract()` (some rulesets discourage it) or still flags `include` inside a method, mark that finding as a false positive in Codacy. Justification: the rule files are designed to read these variables from the including scope, the same way `locals.php` provides them in production.

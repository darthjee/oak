# Plan: ProdConfigurationRoutingTest: reduce method count, coupling and static access to Tent\Configuration (PHPMD)

Issue: [352-prodconfigurationroutingtest-...-phpmd.md](../../issues/352-prodconfigurationroutingtest-reduce-method-count-coupling-and-static-access-to-tent-configuration-phpmd.md)

## Overview
Clear the TooManyMethods (11 > 10), CouplingBetweenObjects (14 > 13) and StaticAccess findings on `ProdConfigurationRoutingTest`. Nothing the test checks changes.

## Context
- `ProdConfigurationRoutingTest` has 11 non-accessor methods. Eight of them are assertion and reflection helpers: `assertStaticHandler`, `assertProxyHandler`, `assertSubmitHandler`, `assertDeleteHandler`, `assertHasMiddleware`, `assertNotHasMiddleware`, `hasMiddleware` and `readProperty`. They are also the only users of most of the imported classes.
- `Tent\Configuration` only has a static API (`reset()`, `getRules()`), so there is no instance to inject. Agreed approach: suppress `PHPMD.StaticAccess` in code, with a documented reason. Do not add wrapper methods, and do not rely on marking false positives in Codacy.
- Precedent: `proxy/extension_tests/PhotoImageFixtures.php` is a trait in namespace `Oak\Proxy\Tests`, used by the photo handler tests. The new trait follows the same pattern and the same folder, so it is autoloaded the same way.

## Implementation Steps

### Step 1 — Extract a `RuleAssertions` trait
Create `proxy/extension_tests/RuleAssertions.php` (`namespace Oak\Proxy\Tests;`, `trait RuleAssertions`) with a short class docblock. Move the eight helpers above into it unchanged, and keep them `private`/`protected` as appropriate. Traits calling `$this->assert*` work because the trait is only used by `TestCase` subclasses. Move the matching `use` imports with them: `CacheControlMiddleware` is not needed there, but `PhotoDeleteRequestHandler`, `PhotoSubmitRequestHandler`, `DefaultProxyRequestHandler`, `ProxyRequestHandler`, `RequestHandler` and `StaticFileHandler` are.

The helpers currently read the test's private constants (`BACKEND_HOST`, `STATIC_ROOT`, `STORAGE_ROOT`, `MAX_UPLOAD_SIZE_BYTES`). A trait must not depend on the using class's private constants, so pass the expected values in explicitly instead. For example:
- `assertStaticHandler(RequestHandler $handler, string $basePath)`
- `assertProxyHandler(RequestHandler $handler, string $host)`
- `assertSubmitHandler(RequestHandler $handler, string $storageRoot, string $host, int $maxUploadSizeBytes)`
- `assertDeleteHandler(RequestHandler $handler, string $storageRoot, string $host)`

Keep the `rtrim(..., '/')` normalisation inside the helpers so the call sites stay simple. Add docblocks with `@param`/`@return`, matching `PhotoImageFixtures`, so the new file does not raise new PHPCS findings.

### Step 2 — Slim down `ProdConfigurationRoutingTest`
- Add `use RuleAssertions;` inside the class, and remove the imports and helper methods that moved to the trait. Keep `CacheControlMiddleware`, `RedirectMiddleware`, `SetPathMiddleware`, `Request`, `Configuration` and `TestCase`.
- Update the call sites in `testProdRulesRouteRequestsInOrder` to pass the expected values: `self::STATIC_ROOT . '/static'` for assets and index, `self::STATIC_ROOT` for photos and snaps, plus `self::BACKEND_HOST`, `self::STORAGE_ROOT` and `self::MAX_UPLOAD_SIZE_BYTES`.
- Add `@SuppressWarnings("PHPMD.StaticAccess")` to the class docblock, with a line explaining that `Tent\Configuration` only has a static API and there is no instance to inject.
- Keep the single-test design, `setUp`/`tearDown`, `loadProdRules`, `includeRuleFile` and `matchingRuleIndex` as they are. After the change the class has 5 methods, well under the limit of 10.

## Files to Change
- `proxy/extension_tests/RuleAssertions.php` — new trait holding the handler/middleware assertion and reflection helpers.
- `proxy/extension_tests/ProdConfigurationRoutingTest.php` — use the trait, drop the moved helpers and imports, pass expected values explicitly, add the StaticAccess suppression.

## CI Checks
- `proxy/extension_tests`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`, PHPUnit on `darthjee/tent-test:1.0.0`)

## Notes
- No behaviour change: every assertion in the test must stay identical in what it checks.
- PHPMD counts methods and coupling per declared class or trait, so the trait's methods and imports no longer count against `ProdConfigurationRoutingTest`. The trait itself (8 methods, about 7 coupled types) stays under both limits.
- Codacy is the only place PHPMD/PHPCS runs; it is not part of the local test command. Check the Codacy report on the PR to confirm the findings are gone and no new ones appeared on `RuleAssertions.php`.

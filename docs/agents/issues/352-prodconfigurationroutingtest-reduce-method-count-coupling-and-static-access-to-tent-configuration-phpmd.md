# Issue: ProdConfigurationRoutingTest: reduce method count, coupling and static access to Tent\Configuration (PHPMD)

## Description
Codacy (PHP Mess Detector) reports five findings on `proxy/extension_tests/ProdConfigurationRoutingTest.php`, the routing spec for the committed production Tent configuration (`proxy/prod_configuration/`). This is a test-only refactor: fix the findings without changing what the test checks. Owner: `proxy` agent.

## Problem
- `rulesets-codesize.xml-TooManyMethods` (line 26): the class has 11 non-accessor methods (limit 10).
- `rulesets-design.xml-CouplingBetweenObjects` (line 26): coupling is 14 (limit 13).
- `rulesets-cleancode.xml-StaticAccess` (lines 41, 59, 139): `\Tent\Configuration::reset()` / `::getRules()` are called statically in `setUp`, `testProdRulesRouteRequestsInOrder` and `matchingRuleIndex`.

Most of the methods are assertion and reflection helpers: `assertStaticHandler`, `assertProxyHandler`, `assertSubmitHandler`, `assertDeleteHandler`, `assertHasMiddleware`, `assertNotHasMiddleware`, `hasMiddleware` and `readProperty`. They also pull in most of the imported classes (`StaticFileHandler`, `DefaultProxyRequestHandler`, `ProxyRequestHandler`, `PhotoSubmitRequestHandler`, `PhotoDeleteRequestHandler`, `RequestHandler`).

`Tent\Configuration` only has a static API, so there is no instance to inject.

## Expected Behavior
- Codacy no longer reports the TooManyMethods and CouplingBetweenObjects findings.
- The StaticAccess findings are suppressed in code, with a documented reason.
- `docker compose run --rm extension_tests` (PHPUnit on `darthjee/tent-test`) still passes.
- No behaviour change: the test makes the same routing and handler assertions, and it keeps the single-test design so the rule files load only once.

## Solution
- Move the handler/middleware assertion and reflection helpers (`assert*Handler`, `assertHasMiddleware`, `assertNotHasMiddleware`, `hasMiddleware`, `readProperty`) into a new trait (not a helper class) under `proxy/extension_tests/` (for example `RuleAssertions`). This follows the existing `PhotoImageFixtures` trait pattern. The trait takes the handler-class imports with it, which brings both the method count and the coupling below the limits.
- The trait needs the backend host, static root, storage root and max upload size values. Pass them in as arguments, or read them from abstract accessors, so the trait does not depend on the test class constants.
- StaticAccess on `Tent\Configuration`: add a `@SuppressWarnings("PHPMD.StaticAccess")` annotation to the test class docblock, with a short note that `Tent\Configuration` only has a static API and there is no instance to inject. Do not add wrapper methods, because they would still be flagged and would add methods. Do not rely on marking the findings as false positives in the Codacy UI.

## Benefits
- Clean Codacy report for the proxy extension tests.
- Reusable rule/handler assertions for future Tent configuration specs.

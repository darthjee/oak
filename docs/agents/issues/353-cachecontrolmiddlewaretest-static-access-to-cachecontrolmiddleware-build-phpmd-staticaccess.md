# Issue: CacheControlMiddlewareTest: static access to CacheControlMiddleware::build (PHPMD StaticAccess)

## Description
Codacy (PHPMD `rulesets-cleancode.xml-StaticAccess`, BestPractice, Warning) reports three findings in `proxy/extension_tests/CacheControlMiddlewareTest.php`, one per test that exercises the `CacheControlMiddleware::build([...])` factory:

- line 111, `testBuildUsesMaxAgeSecondsAttribute`: `CacheControlMiddleware::build(['maxAgeSeconds' => self::MAX_AGE])` ([Codacy](https://app.codacy.com/p/681941/issues/index?resultDataId=131541940725))
- line 120, `testBuildUsesSnakeCaseMaxAgeSecondsAttribute`: `CacheControlMiddleware::build(['max_age_seconds' => 86400])` ([Codacy](https://app.codacy.com/p/681941/issues/index?resultDataId=131541940724))
- line 129, `testBuildDefaultsToZeroMaxAge`: `CacheControlMiddleware::build([])` ([Codacy](https://app.codacy.com/p/681941/issues/index?resultDataId=131541940723))

## Problem
`build(array $attributes)` is the static factory that Tent calls to create middlewares from rule configuration (`'class' => 'Oak\\Proxy\\CacheControlMiddleware', 'maxAgeSeconds' => ...`). It is static by design and cannot be called through an instance. The tests have to call it statically to cover the attribute parsing (`maxAgeSeconds`, `max_age_seconds`, default `0`).

PHPMD's StaticAccess rule flags every static call, so moving the call into a private helper would still leave one finding. The repo has no PHPMD config file, so excluding the rule there is not a lightweight option.

## Expected Behavior
- Codacy no longer reports the three StaticAccess findings above.
- The suppression is documented in the code, with the reason (Tent's static factory contract), so readers can see why it is there.
- `docker compose run --rm extension_tests` (PHPUnit on `darthjee/tent-test`) still passes.
- No behaviour change to `CacheControlMiddleware` and no loss of test coverage for `build`.

## Solution
Follow the precedent from #352 (`ProdConfigurationRoutingTest`, which suppresses StaticAccess because `Tent\Configuration` only has a static API):

1. Add `@SuppressWarnings("PHPMD.StaticAccess")` to the `CacheControlMiddlewareTest` class docblock, adding the docblock if needed. Include a short note that `build()` is Tent's static middleware factory contract, so there is no instance to call it on.
2. Optionally, add a private helper such as `buildMiddleware(array $attributes): CacheControlMiddleware` so the static call appears only once. Only the suppression is required.
3. Do not change `proxy/extension/CacheControlMiddleware.php`.

Owner: `proxy` agent (`proxy/extension_tests/`).

## Benefits
- Clears the Codacy findings without weakening the tests.
- Handles Tent static-factory calls the same way across the proxy test suite.

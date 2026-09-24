# Proxy Plan: CacheControlMiddlewareTest: static access to CacheControlMiddleware::build (PHPMD StaticAccess)

Main plan: [plan.md](plan.md)

## Overview
Suppress PHPMD's StaticAccess rule on `CacheControlMiddlewareTest`, with a comment explaining the reason. This clears the three Codacy findings on the `CacheControlMiddleware::build([...])` calls (lines 111, 120 and 129) without changing behaviour or test coverage.

## Context
`CacheControlMiddleware::build(array $attributes)` is the static factory Tent calls to create a middleware from rule configuration. The three `testBuild*` tests have to call it statically to cover attribute parsing (`maxAgeSeconds`, `max_age_seconds`, default `0`). PHPMD StaticAccess flags every static call, so a helper alone would still leave one finding. The repo has no PHPMD config file. #352 (`ProdConfigurationRoutingTest`) solved the same problem with a class-level docblock like this:

```php
/**
 * ...
 * Tent\Configuration only exposes a static API (reset(), getRules()), so there
 * is no instance to inject.
 *
 * @SuppressWarnings("PHPMD.StaticAccess")
 */
```

## Implementation Steps

### Step 1 — Add a documented StaticAccess suppression to the test class
Add a class docblock to `CacheControlMiddlewareTest` (it has none today). It should include:
- a one-line summary of the spec, e.g. "Spec for Oak\Proxy\CacheControlMiddleware.";
- a short note that `CacheControlMiddleware::build()` is Tent's static middleware factory contract, so the build tests must call it statically;
- `@SuppressWarnings("PHPMD.StaticAccess")`, using the same annotation string as #352.

Do not change any test body, and do not add a helper: the suppression alone clears the findings, and the three explicit `build()` calls read clearly as they are.

### Step 2 — Run the proxy test suite
Run `docker compose run --rm extension_tests` and confirm that all tests pass and the test count is unchanged.

## Files to Change
- `proxy/extension_tests/CacheControlMiddlewareTest.php` — add a class docblock containing the justification and `@SuppressWarnings("PHPMD.StaticAccess")`.

## CI Checks
- `proxy/`: `docker compose run --rm extension_tests` (CI job: `proxy-tests`)

## Notes
- `proxy/extension/CacheControlMiddleware.php` must not change.
- PHPMD/Codacy is not run in CircleCI. The findings clear only after Codacy re-analyses the merged branch.

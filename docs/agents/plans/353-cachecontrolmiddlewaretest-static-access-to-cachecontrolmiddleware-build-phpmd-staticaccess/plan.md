# Plan: CacheControlMiddlewareTest: static access to CacheControlMiddleware::build (PHPMD StaticAccess)

Issue: [353-cachecontrolmiddlewaretest-static-access-to-cachecontrolmiddleware-build-phpmd-staticaccess.md](../../issues/353-cachecontrolmiddlewaretest-static-access-to-cachecontrolmiddleware-build-phpmd-staticaccess.md)

## Overview
Clear three PHPMD StaticAccess warnings in `proxy/extension_tests/CacheControlMiddlewareTest.php` with a documented class-level `@SuppressWarnings("PHPMD.StaticAccess")`, following the precedent set in #352. The static `build()` call is Tent's middleware factory contract. This is a test-only change owned by the `proxy` agent.

See [proxy.md](proxy.md) for the full plan.

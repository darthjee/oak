# Plan: ProdConfigurationRoutingTest: reduce method count, coupling and static access to Tent\Configuration (PHPMD)

Issue: [352-prodconfigurationroutingtest-...-phpmd.md](../../issues/352-prodconfigurationroutingtest-reduce-method-count-coupling-and-static-access-to-tent-configuration-phpmd.md)

## Overview
Test-only refactor of `proxy/extension_tests/ProdConfigurationRoutingTest.php` to clear five Codacy/PHPMD findings: move the handler/middleware assertion helpers into a new `RuleAssertions` trait, and suppress `StaticAccess` on the class because `Tent\Configuration` only has a static API.

See [proxy.md](proxy.md) for the full plan.

# Plan: ProdConfigurationRoutingTest: implicit true comparison in matchingRuleIndex (PHPCS ComparisonOperatorUsage)

Issue: [351-prodconfigurationroutingtest-implicit-true-comparison-in-matchingruleindex-phpcs-comparisonoperatorusage.md](../../issues/351-prodconfigurationroutingtest-implicit-true-comparison-in-matchingruleindex-phpcs-comparisonoperatorusage.md)

## Overview
A one-line change in `proxy/extension_tests/ProdConfigurationRoutingTest.php`: make the rule-match check in `matchingRuleIndex()` an explicit `=== true` comparison, which clears the Codacy PHPCS Squiz `ComparisonOperatorUsage` finding.

See [proxy.md](proxy.md) for the full plan.

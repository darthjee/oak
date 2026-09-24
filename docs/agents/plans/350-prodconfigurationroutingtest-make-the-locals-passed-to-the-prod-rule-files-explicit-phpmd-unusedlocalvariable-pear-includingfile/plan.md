# Plan: ProdConfigurationRoutingTest: make the locals passed to the prod rule files explicit (PHPMD UnusedLocalVariable + PEAR IncludingFile)

Issue: [350-prodconfigurationroutingtest-make-the-locals-passed-to-the-prod-rule-files-explicit-phpmd-unusedlocalvariable-pear-includingfile.md](../../issues/350-prodconfigurationroutingtest-make-the-locals-passed-to-the-prod-rule-files-explicit-phpmd-unusedlocalvariable-pear-includingfile.md)

## Overview
Refactor `loadProdRules()` in `proxy/extension_tests/ProdConfigurationRoutingTest.php` so the stand-in locals and the rule-file includes go through one explicit helper, clearing 10 Codacy findings with no behaviour change. Test-only change, owned by the `proxy` agent.

See [proxy.md](proxy.md) for the full plan.

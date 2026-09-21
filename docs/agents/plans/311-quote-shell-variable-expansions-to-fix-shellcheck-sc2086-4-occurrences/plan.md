# Plan: Quote shell variable expansions to fix ShellCheck SC2086 (4 occurrences)

Issue: [311-quote-shell-variable-expansions-to-fix-shellcheck-sc2086-4-occurrences.md](../../issues/311-quote-shell-variable-expansions-to-fix-shellcheck-sc2086-4-occurrences.md)

## Overview

Quote unquoted shell variable expansions in three shell scripts to fix Codacy's 4 flagged ShellCheck SC2086 warnings, plus a few additional unquoted expansions in the same root-level script for consistency. The two affected scripts under `source/` are backend-owned; the root-level `scripts/prod_shell.sh` doesn't fall under any specialist's documented scope, so it's handled directly by the architect.

## Agents involved

- [backend](backend.md)
- [architect](architect.md)

## Shared contracts

None — the two agents touch entirely independent shell scripts with no shared interface, data shape, or dependency between them.

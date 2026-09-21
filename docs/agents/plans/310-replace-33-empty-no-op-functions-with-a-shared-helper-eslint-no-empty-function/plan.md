# Plan: Replace 33 empty no-op functions with a shared helper (ESLint no-empty-function)

Issue: [310_replace_33_empty_no_op_functions_with_a_shared_helper_eslint_no_empty_function.md](../issues/310-replace-33-empty-no-op-functions-with-a-shared-helper-eslint-no-empty-function.md)

## Overview

Resolve 33 Codacy `@typescript-eslint/no-empty-function` warnings by replacing
inline `() => {}` no-op stubs with named, intent-revealing alternatives: a
new shared `noop` test-support helper for the 32 spec-file occurrences, and a
locally-named no-op for the single production occurrence. Entirely a
frontend refactor with no behavior change.

See [frontend.md](frontend.md) for the full plan.

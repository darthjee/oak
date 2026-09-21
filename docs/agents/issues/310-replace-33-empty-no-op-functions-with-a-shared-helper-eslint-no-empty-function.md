# Issue: Replace 33 empty no-op functions with a shared helper (ESLint no-empty-function)

## Problem

Codacy flags 33 occurrences of ESLint `@typescript-eslint/no-empty-function`
(category BestPractice, severity Warning) — inline `() => {}` arrow functions
used as no-op stubs. 32 of these are test-mock props/callbacks (e.g.
`onChange: () => {}`, `onRemove: () => {}`) spread across 15 frontend spec
files; 1 is production code (`HeaderController.js:89`, a `.catch(() => {})`
that intentionally swallows a rejected promise).

Example: https://app.codacy.com/p/681941/issues/index?resultDataId=131498245064

### Affected locations

- `frontend/assets/js/components/elements/controllers/HeaderController.js:89` (production)
- `frontend/spec/components/elements/CategoryKindBadge_spec.js:8`
- `frontend/spec/components/pages/CategoryItemEdit_spec.js:50`
- `frontend/spec/components/pages/helpers/CategoryItemEditHelper_spec.js:52,53,54,55,56,89,90`
- `frontend/spec/components/elements/CategoryItemLinksEditor_spec.js:10,11,12`
- `frontend/spec/components/pages/helpers/KindNewHelper_spec.js:41,52,60,70`
- `frontend/spec/components/elements/helpers/CategoryKindsEditorListHelper_spec.js:10,21`
- `frontend/spec/components/pages/CategoryItem_spec.js:49`
- `frontend/spec/components/elements/CollectionSelect_spec.js:17`
- `frontend/spec/components/pages/helpers/CategoryNewHelper_spec.js:24,27`
- `frontend/spec/components/elements/CategoryKindSelectInput_spec.js:12,13`
- `frontend/spec/components/pages/CategoryItemNew_spec.js:17`
- `frontend/spec/components/elements/controllers/HeaderController_spec.js:101,172`
- `frontend/spec/components/elements/CategoryKindsEditorList_spec.js:9,21`
- `frontend/spec/components/elements/PhotoCarouselItem_spec.js:124`
- `frontend/spec/components/elements/CategoryKindsEditorSelect_spec.js:12,13`

## Expected Behavior

- ESLint no longer reports `@typescript-eslint/no-empty-function` for any of
  the 33 locations above.
- Runtime behavior of all specs and of `HeaderController` is unchanged —
  this is a pure refactor of how the no-op is expressed, not a behavior
  change.
- The no-op intent is explicit (a named function or import) rather than an
  anonymous empty arrow function.

## Solution

Fix once, apply everywhere, split by context since production and spec code
should not share the same module:

1. Test mocks (32 occurrences, 15 spec files): add a new
   `frontend/spec/support/noop.js` exporting `export const noop = () =>
   {};`, and replace every inline `onX: () => {}` mock prop/callback in the
   affected spec files with `onX: noop` (importing from the new module).
2. Production usage (`HeaderController.js:89`): define a small locally-named
   no-op function/method directly in `HeaderController.js` and use it in
   place of the inline `.catch(() => {})` — no new shared production module,
   since this is currently the only production occurrence.

## Benefits

- Resolves all 33 Codacy `no-empty-function` warnings in one pass.
- Establishes one shared, named no-op pattern for test mocks instead of 32
  independent anonymous stubs, making intent explicit and easing future
  reuse.
- No behavior change; purely a readability/lint-compliance refactor.

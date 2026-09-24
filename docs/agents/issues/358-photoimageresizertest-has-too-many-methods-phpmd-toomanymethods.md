# Issue: PhotoImageResizerTest has too many methods (PHPMD TooManyMethods)

## Description
Codacy (PHPMD `rulesets-codesize.xml-TooManyMethods`, Complexity, Warning) flags `proxy/extension_tests/PhotoImageResizerTest.php:9`:

> The class PhotoImageResizerTest has 12 non-getter- and setter-methods. Consider refactoring PhotoImageResizerTest to keep number of methods under 10.

https://app.codacy.com/p/681941/issues/index?resultDataId=131542068715

## Problem
`PhotoImageResizerTest` (extends `PhotoRequestHandlerTestCase`) has 12 non-accessor methods: 11 tests plus `setUp` and `tempDirPrefix`. The tests fall into three natural groups:

- **Fit / shrink / no-upscale** (6): shrinks large JPEG, shrinks large PNG keeping alpha, fits tall image by height, fits tall image into the snap box, does not upscale small JPEG (copies as-is), does not upscale small PNG.
- **EXIF orientation** (2): rotates orientation-6 JPEG upright, rotates and shrinks orientation-6 JPEG.
- **Failure cases** (3): non-image source, missing source, unwritable destination.

## Expected Behavior
- Codacy no longer reports the TooManyMethods finding for `PhotoImageResizerTest`, and no new PHPMD/Lizard/phpcs findings are introduced by the resulting classes.
- `docker compose run --rm extension_tests` (PHPUnit on `darthjee/tent-test`) still passes with the same 11 test cases (same assertions, no coverage lost).
- No behaviour change in `PhotoImageResizer` or any production code.

## Solution
Follow the same pattern used for #356/#357 (split along responsibility with a shared test-case base class):

- Add `proxy/extension_tests/PhotoImageResizerTestCase.php` — abstract, extends `PhotoRequestHandlerTestCase`, owns the `$resizer` property, `setUp()` and `tempDirPrefix()`.
- Replace `PhotoImageResizerTest.php` with three classes extending it:
  - `PhotoImageResizerFitTest` — the 6 fit/shrink/no-upscale tests.
  - `PhotoImageResizerOrientationTest` — the 2 EXIF orientation tests.
  - `PhotoImageResizerFailureTest` — the 3 failure tests.
- Move the test bodies verbatim; do not merge cases via data providers.
- Scope: `proxy/extension_tests/` only — owned by the `proxy` agent.

## Benefits
- Clears the Codacy TooManyMethods warning.
- Test files grouped by behaviour are easier to navigate and extend.
- Consistent with the structure already adopted for the photo submit/delete handler tests.

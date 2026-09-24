# Plan: PhotoImageResizerTest has too many methods (PHPMD TooManyMethods)

Issue: [358-photoimageresizertest-has-too-many-methods-phpmd-toomanymethods.md](../../issues/358-photoimageresizertest-has-too-many-methods-phpmd-toomanymethods.md)

## Overview
Replace `proxy/extension_tests/PhotoImageResizerTest.php` with three smaller classes — Fit, Orientation and Failure — built on a new abstract `PhotoImageResizerTestCase`, mirroring the split already done for #356/#357. The 11 test bodies move verbatim; no data providers.

## Context
Codacy (PHPMD `TooManyMethods`) reports 12 non-accessor methods in `PhotoImageResizerTest` (11 tests + `setUp` + `tempDirPrefix`), above the limit of 10. The tests group naturally into fit/shrink/no-upscale (6), EXIF orientation (2) and failure cases (3).

## Steps

- [01 — Add PhotoImageResizerTestCase](proxy/01-add-resizer-test-case.md)
- [02 — Add the three split test classes](proxy/02-add-split-test-classes.md)
- [03 — Remove PhotoImageResizerTest](proxy/03-remove-old-test.md)

## CI Checks
- `proxy/extension_tests`: `docker compose run --rm extension_tests` (CircleCI job that copies `proxy/extension_tests` into the Tent test layout)
- Codacy: PHPMD / phpcs / Lizard on the new files — no new findings.

## Notes
- Resulting method counts: Fit 7 (6 tests + `tempDirPrefix`), Orientation 3, Failure 4 — all well under 10.
- Keep one distinct `tempDirPrefix()` per concrete class, as `PhotoSubmitRequestHandlerStorageTest` / `ValidationTest` do, so temp dirs stay distinguishable.
- Test count must stay at 11 with identical assertions.

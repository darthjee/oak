# Plan: PhotoImageFixtures::makeJpeg reported as 51 lines of code (Lizard nloc)

Issue: [354-photoimagefixtures-makejpeg-reported-as-51-lines-of-code-lizard-nloc.md](../../issues/354-photoimagefixtures-makejpeg-reported-as-51-lines-of-code-lizard-nloc.md)

## Overview
The Lizard NLOC finding on `PhotoImageFixtures::makeJpeg`, and the matching one on `RuleAssertions::assertStaticHandler`, are analyzer false positives. The fix is to mark them as false positives in Codacy, with a justification. No repository code changes.

## Context
Lizard 1.24.0 (run locally) doesn't recognise PHP's `trait` keyword as a type scope. After the first method of a trait it stops finding function boundaries and counts the rest of the file as that method:

- `proxy/extension_tests/PhotoImageFixtures.php`: reported as `makeJpeg@20-108`, 51 NLOC. Changing `trait` to `class`, with nothing else changed, gives `makeJpeg` 15, `makePng` 17, `makeJpegWithOrientation` 13 and `imageInfo` 5 NLOC.
- `proxy/extension_tests/RuleAssertions.php`: reported as `assertStaticHandler@26-152`, 60 NLOC, for the same reason.

The escaped binary strings in `makeJpegWithOrientation()` were checked and are not the cause. Removing them doesn't change the result.

The owner chose to keep both traits as they are and to mark the findings as false positives instead of restructuring the code.

## Implementation Steps

### Step 1 — Mark the PhotoImageFixtures finding as a false positive (manual, Codacy UI)
Open https://app.codacy.com/p/681941/issues/index?resultDataId=131542068603 and mark the `Lizard_nloc-medium` finding on `PhotoImageFixtures::makeJpeg` as a false positive. Justification: "Lizard's PHP reader doesn't recognise `trait` and merges every method of the trait into the first one; the real `makeJpeg` is 15 NLOC."

### Step 2 — Mark the RuleAssertions finding as a false positive (manual, Codacy UI)
If Codacy reports a Lizard NLOC finding on `RuleAssertions::assertStaticHandler` (`proxy/extension_tests/RuleAssertions.php`), mark it as a false positive with the same justification.

## Files to Change
- None. This issue is resolved entirely in Codacy.

## Notes
- Both steps are manual actions in the Codacy UI. `auto-fix-issue` can't do them, and a PR opened for this issue would contain only the issue and plan docs.
- Any new `trait` added to the PHP test suite will hit the same Lizard misparse. If this keeps happening, consider moving shared test helpers to abstract base classes instead.

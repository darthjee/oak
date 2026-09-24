# Issue: PhotoImageFixtures::makeJpeg reported as 51 lines of code (Lizard nloc)

## Description
Codacy (Lizard) reports:

- `proxy/extension_tests/PhotoImageFixtures.php:20`: `Lizard_nloc-medium` (Complexity, Warning): Method PhotoImageFixtures::makeJpeg has 51 lines of code (limit is 50)
  https://app.codacy.com/p/681941/issues/index?resultDataId=131542068603

## Problem
`makeJpeg()` is only 15 lines. Running Lizard 1.24.0 locally shows why it gets 51: Lizard reads lines 20–108 as one function, `makeJpeg`, which is every method in the trait.

The cause is the `trait` keyword. Lizard's PHP reader doesn't recognise `trait` as a type scope. So after the first method it never finds the next function boundary, and it merges the rest of the file into the first method. The escaped binary strings in `makeJpegWithOrientation()` are **not** the cause. Checked locally:

- Replacing `trait` with `class`, with nothing else changed, gives 4 functions: `makeJpeg` 15, `makePng` 17, `makeJpegWithOrientation` 13, `imageInfo` 5 NLOC.
- Removing the escapes, return types or parameter types changes nothing (still one 51-NLOC function).

The other trait in the suite, `proxy/extension_tests/RuleAssertions.php` (added in #352), has the same problem. Lizard reports it as a single `assertStaticHandler` of 60 NLOC spanning lines 26–152.

## Expected Behavior
Lizard/Codacy measures each fixture method on its own, and none of them goes over the NLOC limit.

## Solution
Keep both traits as they are and treat the Lizard findings as analyzer false positives:

- In Codacy, mark the `PhotoImageFixtures::makeJpeg` NLOC finding as a false positive. Justification: Lizard 1.24's PHP reader doesn't recognise `trait` and merges every method of the trait into the first one. The real `makeJpeg` is 15 NLOC.
- Do the same for the matching finding on `RuleAssertions::assertStaticHandler` (`proxy/extension_tests/RuleAssertions.php`), if Codacy reports it, with the same justification.
- Don't restructure the code. The traits stay, and so does the EXIF construction in `makeJpegWithOrientation()`.

Acceptance criteria:

- Codacy no longer lists the Lizard NLOC findings for either trait, because they are marked as false positives with the justification above.
- No code or behaviour change. `docker compose run --rm extension_tests` is unaffected.

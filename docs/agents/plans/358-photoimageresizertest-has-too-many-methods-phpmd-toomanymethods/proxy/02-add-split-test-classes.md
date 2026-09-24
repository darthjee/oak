# Add the three split test classes
Create three classes extending `PhotoImageResizerTestCase`, each `require_once`-ing it and defining its own `tempDirPrefix()`. Move test methods verbatim from `PhotoImageResizerTest`.

- `PhotoImageResizerFitTest` (prefix `photo_resizer_fit_test_`):
  `testShrinksALargeJpegToFitTheBoxKeepingAspectRatio`, `testShrinksALargePngToFitTheBoxKeepingAlpha`, `testFitsATallImageByHeight`, `testFitsATallImageIntoTheSnapBox`, `testDoesNotUpscaleASmallImageAndCopiesItAsIs`, `testDoesNotUpscaleASmallPng`.
- `PhotoImageResizerOrientationTest` (prefix `photo_resizer_orientation_test_`):
  `testRotatesAJpegWithExifOrientationSixUpright` (keep its explanatory comment), `testRotatesAndShrinksAJpegWithExifOrientation`.
- `PhotoImageResizerFailureTest` (prefix `photo_resizer_failure_test_`):
  `testReturnsFalseForANonImageSource`, `testReturnsFalseForAMissingSource`, `testReturnsFalseWhenTheDestinationCannotBeWritten`.

## Files to Change
- `proxy/extension_tests/PhotoImageResizerFitTest.php` — new.
- `proxy/extension_tests/PhotoImageResizerOrientationTest.php` — new.
- `proxy/extension_tests/PhotoImageResizerFailureTest.php` — new.

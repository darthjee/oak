# Split the handler test into validation and storage tests
Replace `PhotoSubmitRequestHandlerTest` with two classes that extend `PhotoSubmitRequestHandlerTestCase` and each implement `tempDirPrefix()`. Move the test bodies as they are.

`PhotoSubmitRequestHandlerValidationTest` (prefix `photo_submit_validation_test_`):
- `testRejectsDisallowedExtensionWithoutCallingBackendOrWriting`
- `testRejectsOversizedUploadWithoutCallingBackendOrWriting`
- `testStopsBeforeWritingWhenTheUploadingGateIsRejected`

`PhotoSubmitRequestHandlerStorageTest` (prefix `photo_submit_storage_test_`):
- `testHappyPathGatesWritesAllVersionsAndFinalizes`
- `testHappyPathWritesAllPngVersions`
- `testResizeFailureRemovesEveryFileAndDoesNotFinalize`
- `testRejectsFilePathEscapingThePrefixFolder`
- `testPhotoPathGuardAllowsLegitimateDeeplyNestedFilePath`

Drop `testTallImageKeepsItsAspectRatio` and `testSmallImageIsNotUpscaled`, which `PhotoImageResizerTest` already covers. Delete the original file.

## Files to Change
- `proxy/extension_tests/PhotoSubmitRequestHandlerValidationTest.php` — new file with the validation and gate tests.
- `proxy/extension_tests/PhotoSubmitRequestHandlerStorageTest.php` — new file with the storage and resize tests.
- `proxy/extension_tests/PhotoSubmitRequestHandlerTest.php` — deleted.

# Plan: PhotoImageResizerTest has too many methods (PHPMD TooManyMethods)

Issue: [358-photoimageresizertest-has-too-many-methods-phpmd-toomanymethods.md](../../issues/358-photoimageresizertest-has-too-many-methods-phpmd-toomanymethods.md)

## Overview
Split `PhotoImageResizerTest` (12 methods) into three behaviour-focused test classes sharing an abstract `PhotoImageResizerTestCase`, clearing the PHPMD TooManyMethods warning with no behaviour change.

See [proxy.md](proxy.md) for the full plan.

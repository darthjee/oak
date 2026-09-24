<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoRequestHandlerTestCase.php';

use Oak\Proxy\PhotoImageResizer;

/**
 * Shared fixture for the PhotoImageResizer tests: builds the resizer under
 * test on top of the temporary storage root and image helpers.
 */
abstract class PhotoImageResizerTestCase extends PhotoRequestHandlerTestCase
{
    protected PhotoImageResizer $resizer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resizer = new PhotoImageResizer();
    }
}

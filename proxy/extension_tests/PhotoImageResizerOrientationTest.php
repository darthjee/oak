<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoImageResizerTestCase.php';

class PhotoImageResizerOrientationTest extends PhotoImageResizerTestCase
{
    protected function tempDirPrefix(): string
    {
        return 'photo_resizer_orientation_test_';
    }

    public function testRotatesAJpegWithExifOrientationSixUpright(): void
    {
        $source = $this->makeJpegWithOrientation($this->storageRoot . '/rotated.jpg', 400, 200, 6);
        $destination = $this->storageRoot . '/out.jpg';

        $this->assertSame(6, exif_read_data($source)['Orientation']);

        $this->assertTrue($this->resizer->resize($source, $destination, 800, 1064));

        $this->assertSame([200, 400, IMAGETYPE_JPEG], $this->imageInfo($destination));

        // Orientation 6 means "rotate 90 degrees clockwise to display": the
        // stored top-left (blue) block ends up in the top-right corner.
        $image = imagecreatefromjpeg($destination);
        $topRight = imagecolorsforindex($image, imagecolorat($image, 190, 10));
        $topLeft = imagecolorsforindex($image, imagecolorat($image, 10, 10));

        $this->assertGreaterThan($topRight['red'], $topRight['blue']);
        $this->assertGreaterThan($topLeft['blue'], $topLeft['red']);
    }

    public function testRotatesAndShrinksAJpegWithExifOrientation(): void
    {
        $source = $this->makeJpegWithOrientation($this->storageRoot . '/rotated.jpg', 2128, 800, 6);
        $destination = $this->storageRoot . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 800, 1064));

        $this->assertSame([400, 1064, IMAGETYPE_JPEG], $this->imageInfo($destination));
    }
}

<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoRequestHandlerTestCase.php';
require_once __DIR__ . '/PhotoImageFixtures.php';

use Oak\Proxy\PhotoImageResizer;

class PhotoImageResizerTest extends PhotoRequestHandlerTestCase
{
    use PhotoImageFixtures;

    private PhotoImageResizer $resizer;

    protected function setUp(): void
    {
        parent::setUp();

        $this->resizer = new PhotoImageResizer();
    }

    protected function tempDirPrefix(): string
    {
        return 'photo_resizer_test_';
    }

    public function testShrinksALargeJpegToFitTheBoxKeepingAspectRatio(): void
    {
        $source = $this->makeJpeg($this->photosPath . '/large.jpg', 2000, 1500);
        $destination = $this->photosPath . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 800, 1064));

        $this->assertSame([800, 600, IMAGETYPE_JPEG], $this->imageInfo($destination));
    }

    public function testShrinksALargePngToFitTheBoxKeepingAlpha(): void
    {
        $source = $this->makePng($this->photosPath . '/large.png', 2000, 1500);
        $destination = $this->photosPath . '/out.png';

        $this->assertTrue($this->resizer->resize($source, $destination, 215, 215));

        $this->assertSame([215, 161, IMAGETYPE_PNG], $this->imageInfo($destination));

        $image = imagecreatefrompng($destination);
        $corner = imagecolorsforindex($image, imagecolorat($image, 0, 0));
        $center = imagecolorsforindex($image, imagecolorat($image, 107, 80));

        $this->assertSame(127, $corner['alpha']);
        $this->assertSame(0, $center['alpha']);
    }

    public function testFitsATallImageByHeight(): void
    {
        $source = $this->makeJpeg($this->photosPath . '/tall.jpg', 800, 2128);
        $destination = $this->photosPath . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 800, 1064));

        $this->assertSame([400, 1064, IMAGETYPE_JPEG], $this->imageInfo($destination));
    }

    public function testFitsATallImageIntoTheSnapBox(): void
    {
        $source = $this->makeJpeg($this->photosPath . '/tall.jpg', 800, 2128);
        $destination = $this->photosPath . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 215, 215));

        $this->assertSame([81, 215, IMAGETYPE_JPEG], $this->imageInfo($destination));
    }

    public function testDoesNotUpscaleASmallImageAndCopiesItAsIs(): void
    {
        $source = $this->makeJpeg($this->photosPath . '/small.jpg', 100, 80);
        $destination = $this->photosPath . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 800, 1064));

        $this->assertSame([100, 80, IMAGETYPE_JPEG], $this->imageInfo($destination));
        $this->assertFileEquals($source, $destination);
    }

    public function testDoesNotUpscaleASmallPng(): void
    {
        $source = $this->makePng($this->photosPath . '/small.png', 100, 80);
        $destination = $this->photosPath . '/out.png';

        $this->assertTrue($this->resizer->resize($source, $destination, 215, 215));

        $this->assertSame([100, 80, IMAGETYPE_PNG], $this->imageInfo($destination));
    }

    public function testRotatesAJpegWithExifOrientationSixUpright(): void
    {
        $source = $this->makeJpegWithOrientation($this->photosPath . '/rotated.jpg', 400, 200, 6);
        $destination = $this->photosPath . '/out.jpg';

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
        $source = $this->makeJpegWithOrientation($this->photosPath . '/rotated.jpg', 2128, 800, 6);
        $destination = $this->photosPath . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 800, 1064));

        $this->assertSame([400, 1064, IMAGETYPE_JPEG], $this->imageInfo($destination));
    }

    public function testReturnsFalseForANonImageSource(): void
    {
        $source = $this->photosPath . '/not_an_image.jpg';
        file_put_contents($source, 'not an image');
        $destination = $this->photosPath . '/out.jpg';

        $this->assertFalse($this->resizer->resize($source, $destination, 800, 1064));
        $this->assertFileDoesNotExist($destination);
    }

    public function testReturnsFalseForAMissingSource(): void
    {
        $destination = $this->photosPath . '/out.jpg';

        $this->assertFalse($this->resizer->resize($this->photosPath . '/missing.jpg', $destination, 800, 1064));
        $this->assertFileDoesNotExist($destination);
    }

    public function testReturnsFalseWhenTheDestinationCannotBeWritten(): void
    {
        $source = $this->makeJpeg($this->photosPath . '/large.jpg', 2000, 1500);
        $destination = $this->photosPath . '/missing_dir/out.jpg';

        $this->assertFalse($this->resizer->resize($source, $destination, 800, 1064));
        $this->assertFileDoesNotExist($destination);
    }
}

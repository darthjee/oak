<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoImageResizerTestCase.php';

class PhotoImageResizerFitTest extends PhotoImageResizerTestCase
{
    protected function tempDirPrefix(): string
    {
        return 'photo_resizer_fit_test_';
    }

    public function testShrinksALargeJpegToFitTheBoxKeepingAspectRatio(): void
    {
        $source = $this->makeJpeg($this->storageRoot . '/large.jpg', 2000, 1500);
        $destination = $this->storageRoot . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 800, 1064));

        $this->assertSame([800, 600, IMAGETYPE_JPEG], $this->imageInfo($destination));
    }

    public function testShrinksALargePngToFitTheBoxKeepingAlpha(): void
    {
        $source = $this->makePng($this->storageRoot . '/large.png', 2000, 1500);
        $destination = $this->storageRoot . '/out.png';

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
        $source = $this->makeJpeg($this->storageRoot . '/tall.jpg', 800, 2128);
        $destination = $this->storageRoot . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 800, 1064));

        $this->assertSame([400, 1064, IMAGETYPE_JPEG], $this->imageInfo($destination));
    }

    public function testFitsATallImageIntoTheSnapBox(): void
    {
        $source = $this->makeJpeg($this->storageRoot . '/tall.jpg', 800, 2128);
        $destination = $this->storageRoot . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 215, 215));

        $this->assertSame([81, 215, IMAGETYPE_JPEG], $this->imageInfo($destination));
    }

    public function testDoesNotUpscaleASmallImageAndCopiesItAsIs(): void
    {
        $source = $this->makeJpeg($this->storageRoot . '/small.jpg', 100, 80);
        $destination = $this->storageRoot . '/out.jpg';

        $this->assertTrue($this->resizer->resize($source, $destination, 800, 1064));

        $this->assertSame([100, 80, IMAGETYPE_JPEG], $this->imageInfo($destination));
        $this->assertFileEquals($source, $destination);
    }

    public function testDoesNotUpscaleASmallPng(): void
    {
        $source = $this->makePng($this->storageRoot . '/small.png', 100, 80);
        $destination = $this->storageRoot . '/out.png';

        $this->assertTrue($this->resizer->resize($source, $destination, 215, 215));

        $this->assertSame([100, 80, IMAGETYPE_PNG], $this->imageInfo($destination));
    }
}

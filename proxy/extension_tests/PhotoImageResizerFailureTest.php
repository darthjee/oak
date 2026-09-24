<?php

namespace Oak\Proxy\Tests;

require_once __DIR__ . '/PhotoImageResizerTestCase.php';

class PhotoImageResizerFailureTest extends PhotoImageResizerTestCase
{
    protected function tempDirPrefix(): string
    {
        return 'photo_resizer_failure_test_';
    }

    public function testReturnsFalseForANonImageSource(): void
    {
        $source = $this->storageRoot . '/not_an_image.jpg';
        file_put_contents($source, 'not an image');
        $destination = $this->storageRoot . '/out.jpg';

        $this->assertFalse($this->resizer->resize($source, $destination, 800, 1064));
        $this->assertFileDoesNotExist($destination);
    }

    public function testReturnsFalseForAMissingSource(): void
    {
        $destination = $this->storageRoot . '/out.jpg';

        $this->assertFalse($this->resizer->resize($this->storageRoot . '/missing.jpg', $destination, 800, 1064));
        $this->assertFileDoesNotExist($destination);
    }

    public function testReturnsFalseWhenTheDestinationCannotBeWritten(): void
    {
        $source = $this->makeJpeg($this->storageRoot . '/large.jpg', 2000, 1500);
        $destination = $this->storageRoot . '/missing_dir/out.jpg';

        $this->assertFalse($this->resizer->resize($source, $destination, 800, 1064));
        $this->assertFileDoesNotExist($destination);
    }
}

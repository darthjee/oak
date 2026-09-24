<?php

namespace Oak\Proxy\Tests;

/**
 * Builds test images with GD at run time, so no binary fixtures need to be
 * committed.
 */
trait PhotoImageFixtures
{
    /**
     * Writes a jpeg of the given size at `$path`: red, with a blue block in
     * the top-left corner (used to check orientation).
     *
     * @param string  $path   Destination path.
     * @param integer $width  Image width.
     * @param integer $height Image height.
     * @return string The path.
     */
    protected function makeJpeg(string $path, int $width, int $height): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagefill($image, 0, 0, imagecolorallocate($image, 200, 50, 50));
        imagefilledrectangle(
            $image,
            0,
            0,
            max(0, intdiv($width, 4) - 1),
            max(0, intdiv($height, 4) - 1),
            imagecolorallocate($image, 50, 50, 200)
        );
        imagejpeg($image, $path, 90);

        return $path;
    }

    /**
     * Writes a png of the given size at `$path`, fully transparent except for
     * an opaque square in the middle.
     *
     * @param string  $path   Destination path.
     * @param integer $width  Image width.
     * @param integer $height Image height.
     * @return string The path.
     */
    protected function makePng(string $path, int $width, int $height): string
    {
        $image = imagecreatetruecolor($width, $height);
        imagealphablending($image, false);
        imagesavealpha($image, true);
        imagefill($image, 0, 0, imagecolorallocatealpha($image, 0, 0, 0, 127));
        imagefilledrectangle(
            $image,
            intdiv($width, 4),
            intdiv($height, 4),
            intdiv($width * 3, 4),
            intdiv($height * 3, 4),
            imagecolorallocatealpha($image, 50, 200, 50, 0)
        );
        imagepng($image, $path);

        return $path;
    }

    /**
     * Writes a jpeg of the given size at `$path` carrying an EXIF
     * Orientation tag.
     *
     * GD can't write EXIF, so a minimal APP1 "Exif" segment (a big-endian
     * TIFF header with a single IFD0 entry: Orientation, SHORT) is spliced in
     * right after the jpeg SOI marker.
     *
     * @param string  $path        Destination path.
     * @param integer $width       Image width (as stored).
     * @param integer $height      Image height (as stored).
     * @param integer $orientation EXIF Orientation value (1-8).
     * @return string The path.
     */
    protected function makeJpegWithOrientation(string $path, int $width, int $height, int $orientation): string
    {
        $this->makeJpeg($path, $width, $height);
        $bytes = file_get_contents($path);

        $tiff = "MM\x00\x2a" . pack('N', 8)
            . pack('n', 1)
            . pack('nnN', 0x0112, 3, 1) . pack('n', $orientation) . "\x00\x00"
            . pack('N', 0);
        $payload = "Exif\x00\x00" . $tiff;
        $segment = "\xFF\xE1" . pack('n', strlen($payload) + 2) . $payload;

        file_put_contents($path, substr($bytes, 0, 2) . $segment . substr($bytes, 2));

        return $path;
    }

    /**
     * Returns [width, height, type] of the image at `$path`.
     *
     * @param string $path Image path.
     * @return array{0: int, 1: int, 2: int}
     */
    protected function imageInfo(string $path): array
    {
        $info = getimagesize($path);

        return [$info[0], $info[1], $info[2]];
    }
}

<?php

namespace Oak\Proxy;

/**
 * Makes a resized copy of a jpeg or png photo with PHP GD.
 *
 * Resize rules (matching ImageMagick's `-resize WxH>` used by
 * `prod_public_files/convert.sh`):
 *
 * - Fit, shrink only: the aspect ratio is kept and the image is scaled down
 *   until both sides fit the box. An image that already fits is copied as is.
 * - EXIF orientation (jpeg only) is applied before measuring, so the output
 *   is upright.
 * - The output format matches the input: jpeg (quality 85) or png (with
 *   transparency kept).
 *
 * The class knows nothing about the photo storage layout: it works only on
 * the source and destination paths it is given. It never throws; any
 * failure returns false.
 */
class PhotoImageResizer
{
    /** JPEG output quality. */
    public const JPEG_QUALITY = 85;

    /**
     * EXIF orientation => [rotation angle (counter-clockwise, GD style), flip mode or null].
     */
    private const ORIENTATIONS = [
        2 => [0, IMG_FLIP_HORIZONTAL],
        3 => [180, null],
        4 => [0, IMG_FLIP_VERTICAL],
        5 => [-90, IMG_FLIP_HORIZONTAL],
        6 => [-90, null],
        7 => [90, IMG_FLIP_HORIZONTAL],
        8 => [90, null]
    ];

    /**
     * Writes a copy of `$source` at `$destination` that fits within
     * `$maxWidth` x `$maxHeight`.
     *
     * @param string  $source      Path of the original image.
     * @param string  $destination Path to write the resized image to.
     * @param integer $maxWidth    Maximum width of the output.
     * @param integer $maxHeight   Maximum height of the output.
     * @return boolean True on success, false on any failure.
     */
    public function resize(string $source, string $destination, int $maxWidth, int $maxHeight): bool
    {
        $type = $this->imageType($source);

        if ($type === null || $maxWidth < 1 || $maxHeight < 1) {
            return false;
        }

        $transform = $this->orientationTransform($source, $type);
        $image = $this->load($source, $type);

        if ($image !== null && $transform !== null) {
            $image = $this->applyTransform($image, $transform);
        }

        if ($image === null) {
            return false;
        }

        $scale = min(1, $maxWidth / imagesx($image), $maxHeight / imagesy($image));

        if ($scale >= 1 && $transform === null) {
            imagedestroy($image);
            return @copy($source, $destination);
        }

        $result = $this->resample($image, $destination, $type, $scale);

        imagedestroy($image);

        return $result;
    }

    /**
     * Returns the GD image type of `$source` when it is a jpeg or png.
     *
     * @param string $source Path of the image.
     * @return integer|null IMAGETYPE_JPEG, IMAGETYPE_PNG or null.
     */
    private function imageType(string $source): ?int
    {
        if (is_file($source) === FALSE) {
            return null;
        }

        $info = @getimagesize($source);

        if ($info === false || in_array($info[2], [IMAGETYPE_JPEG, IMAGETYPE_PNG], true) === FALSE) {
            return null;
        }

        return $info[2];
    }

    /**
     * Loads `$source` as a GD image.
     *
     * @param string  $source Path of the image.
     * @param integer $type   IMAGETYPE_JPEG or IMAGETYPE_PNG.
     * @return \GdImage|null
     */
    private function load(string $source, int $type)
    {
        $image = $type === IMAGETYPE_JPEG ? @imagecreatefromjpeg($source) : @imagecreatefrompng($source);

        return $image === false ? null : $image;
    }

    /**
     * Returns the [angle, flip] transform needed to make a jpeg upright
     * according to its EXIF Orientation tag, or null when none is needed.
     *
     * @param string  $source Path of the image.
     * @param integer $type   IMAGETYPE_JPEG or IMAGETYPE_PNG.
     * @return array|null
     */
    private function orientationTransform(string $source, int $type): ?array
    {
        if ($type !== IMAGETYPE_JPEG || function_exists('exif_read_data') === FALSE) {
            return null;
        }

        $exif = @exif_read_data($source);

        if (is_array($exif) === FALSE || isset($exif['Orientation']) === FALSE) {
            return null;
        }

        return self::ORIENTATIONS[(int) $exif['Orientation']] ?? null;
    }

    /**
     * Rotates and/or flips `$image`. The given image is freed when a new one
     * is made.
     *
     * @param \GdImage $image     The loaded image.
     * @param array    $transform [angle (counter-clockwise), flip mode or null].
     * @return \GdImage|null The transformed image, or null on failure.
     */
    private function applyTransform($image, array $transform)
    {
        [$angle, $flip] = $transform;

        if ($angle !== 0) {
            $rotated = imagerotate($image, $angle, 0);
            imagedestroy($image);
            $image = $rotated === false ? null : $rotated;
        }

        if ($image !== null && $flip !== null && imageflip($image, $flip) === FALSE) {
            imagedestroy($image);
            $image = null;
        }

        return $image;
    }

    /**
     * Scales `$image` by `$scale` and saves it at `$destination`.
     *
     * @param \GdImage $image       The (oriented) image.
     * @param string   $destination Path to write to.
     * @param integer  $type        IMAGETYPE_JPEG or IMAGETYPE_PNG.
     * @param float    $scale       Scale factor, at most 1.
     * @return boolean
     */
    private function resample($image, string $destination, int $type, float $scale): bool
    {
        $srcWidth = imagesx($image);
        $srcHeight = imagesy($image);
        $width = max(1, (int) round($srcWidth * $scale));
        $height = max(1, (int) round($srcHeight * $scale));

        $canvas = $this->canvas($width, $height, $type);

        if ($canvas === null) {
            return false;
        }

        $copied = imagecopyresampled($canvas, $image, 0, 0, 0, 0, $width, $height, $srcWidth, $srcHeight);
        $saved = $copied && $this->save($canvas, $destination, $type);

        imagedestroy($canvas);

        return $saved;
    }

    /**
     * Creates an empty truecolor image; png canvases keep alpha.
     *
     * @param integer $width  Width.
     * @param integer $height Height.
     * @param integer $type   IMAGETYPE_JPEG or IMAGETYPE_PNG.
     * @return \GdImage|null
     */
    private function canvas(int $width, int $height, int $type)
    {
        $canvas = imagecreatetruecolor($width, $height);

        if ($canvas === false) {
            return null;
        }

        if ($type === IMAGETYPE_PNG) {
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);
            imagefill($canvas, 0, 0, imagecolorallocatealpha($canvas, 0, 0, 0, 127));
        }

        return $canvas;
    }

    /**
     * Saves `$image` at `$destination` in the given format.
     *
     * @param \GdImage $image       The image.
     * @param string   $destination Path to write to.
     * @param integer  $type        IMAGETYPE_JPEG or IMAGETYPE_PNG.
     * @return boolean
     */
    private function save($image, string $destination, int $type): bool
    {
        if ($type === IMAGETYPE_JPEG) {
            return @imagejpeg($image, $destination, self::JPEG_QUALITY);
        }

        return @imagepng($image, $destination);
    }
}

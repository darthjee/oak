# Add PhotoImageResizer
Add `Oak\Proxy\PhotoImageResizer` in `proxy/extension/PhotoImageResizer.php`, a GD-only class with no filesystem path knowledge beyond its arguments, so the submit handler stays small and the resize rules can be tested on their own.

API (suggested): `resize(string $source, string $destination, int $maxWidth, int $maxHeight): bool`.

- Detect the type with `getimagesize()` (`IMAGETYPE_JPEG` / `IMAGETYPE_PNG`); anything else returns false.
- Load with `imagecreatefromjpeg` / `imagecreatefrompng`.
- **EXIF orientation** (jpeg only): read `exif_read_data($source)['Orientation']` (guard with `function_exists` and `@` / false checks) and apply it before measuring: 3 → `imagerotate(180)`, 6 → `imagerotate(-90)`, 8 → `imagerotate(90)`; 2/4/5/7 also need `imageflip`. Rotation swaps width and height.
- **Fit, shrink only**: `scale = min(1, maxWidth / w, maxHeight / h)`; new size `max(1, round(w * scale))` x `max(1, round(h * scale))`. For 800x2128 in 800x1064 that's 400x1064. When `scale == 1` and no EXIF rotation was applied, `copy()` the source as is (matches ImageMagick `>`); otherwise resample.
- Resample with `imagecreatetruecolor` + `imagecopyresampled`. For png: `imagealphablending($dst, false)` and `imagesavealpha($dst, true)` before copying.
- Save in the input format: `imagejpeg($dst, $destination, 85)` or `imagepng($dst, $destination)`. Free the images with `imagedestroy`.
- Return false on any GD failure, never throw.

Expose the two boxes as constants where the handler will use them (e.g. `PhotoSubmitRequestHandler::PHOTO_MAX = [800, 1064]`, `SNAP_MAX = [215, 215]`), not as rule options.

Register the class in `proxy/extension/loader.php` (before `PhotoSubmitRequestHandler.php`).

Specs in `proxy/extension_tests/PhotoImageResizerTest.php`, making images with GD in the test (no committed binaries):
- large jpeg (e.g. 2000x1500) → fits 800x1064 with aspect ratio kept; same for png, and the png keeps alpha (check a transparent pixel with `imagecolorat`);
- 800x2128 → 400x1064;
- small image (100x80) → same dimensions (not upscaled);
- output type matches input (`getimagesize()[2]`);
- EXIF orientation 6 jpeg → output is rotated (width and height swapped). GD can't write EXIF, so build the fixture by splicing a minimal APP1 Exif segment with an Orientation tag into the GD-made jpeg bytes (a small helper in the test);
- a non-image source returns false.

## Files to Change
- `proxy/extension/PhotoImageResizer.php` — new resizer class.
- `proxy/extension/loader.php` — require the new class.
- `proxy/extension_tests/PhotoImageResizerTest.php` — new specs.

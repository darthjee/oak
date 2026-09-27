<?php

namespace Oak\Proxy\Tests;

use Oak\Proxy\PhotoPathGuard;
use PHPUnit\Framework\TestCase;

class PhotoPathGuardTest extends TestCase
{
    /**
     * @dataProvider validPhotoPaths
     */
    public function testAcceptsWellShapedPhotoPaths(string $path): void
    {
        $this->assertTrue((new PhotoPathGuard())->isValidPhotoPath($path));
    }

    /**
     * @dataProvider invalidPhotoPaths
     */
    public function testRejectsMalformedPhotoPaths(string $path): void
    {
        $this->assertFalse((new PhotoPathGuard())->isValidPhotoPath($path));
    }

    public static function validPhotoPaths(): array
    {
        return [
            'plain name' => ['users/3/items/42/abc.jpg'],
            'uuid name' => ['users/3/items/42/abc-0b8f5c1e-9d2a-4c1b-8f7e-2a1d3c4b5e6f.jpg'],
            'spaces' => ['users/3/items/42/my photo 1.jpg'],
            'accents' => ['users/3/items/42/fotografia ação é.jpeg'],
            'single dot inside name' => ['users/3/items/42/a.b.c']
        ];
    }

    public static function invalidPhotoPaths(): array
    {
        return [
            'parent directory name' => ['users/3/items/42/..'],
            'current directory name' => ['users/3/items/42/.'],
            'double dot inside name' => ['users/3/items/42/a..jpg'],
            'traversal segment' => ['users/3/items/../42/a.jpg'],
            'nul byte' => ["users/3/items/42/a\0.jpg"],
            'absolute path' => ['/users/3/items/42/a.jpg'],
            'wrong prefix' => ['people/3/items/42/a.jpg'],
            'non numeric user' => ['users/x/items/42/a.jpg'],
            'non numeric item' => ['users/3/items/x/a.jpg'],
            'empty file name' => ['users/3/items/42/'],
            'extra segment' => ['users/3/items/42/sub/a.jpg'],
            'empty path' => ['']
        ];
    }
}

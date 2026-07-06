<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

class ImageHelper
{
    protected static function manager(): ImageManager
    {
        return new ImageManager(new Driver());
    }

    public static function uploadSingle(
        $file,
        string $folder,
        ?string $oldFile = null,
        int $quality = 95
    ): ?string {
        if (!$file) return null;

        $name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        $filename =
            time() . '-'
            . Str::slug($name) . '-'
            . uniqid()
            . '.webp';

        $path = "/uploads/{$folder}/{$filename}";

        $image = self::manager()->decode($file);

        $encoded = $image->encode(
            new WebpEncoder(quality: $quality)
        );

        Storage::disk('public')->put($path, (string) $encoded);

        if ($oldFile) {
            Storage::disk('public')->delete($oldFile);
        }

        return $path;
    }

    public static function uploadMultiple(array $files, string $folder, int $quality = 95): array
    {
        $images = [];

        foreach ($files as $index => $file) {
            if (!$file) continue;

            $name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

            $filename =
                time() . '-'
                . Str::slug($name) . '-'
                . $index . '-'
                . uniqid()
                . '.webp';

            $path = "/uploads/{$folder}/{$filename}";

            $image = self::manager()->decode($file);

            $encoded = $image->encode(
                new WebpEncoder(quality: $quality)
            );

            Storage::disk('public')->put($path, (string) $encoded);

            $images[] = $path;
        }

        return $images;
    }

    public static function delete(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    public static function url(?string $path): ?string
    {
        return $path ? Storage::url($path) : null;
    }
}

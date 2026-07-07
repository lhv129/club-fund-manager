<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class FileHelper
{
    /**
     * UPLOAD ANY FILE (pdf, doc, image raw, etc.)
     */
    public static function upload(
        $file,
        string $folder,
        ?string $oldFile = null
    ): ?string {
        if (!$file) return null;
        $name = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

        $filename =
            time() . '-'
            . Str::slug($name) . '-'
            . uniqid() . '.'
            . $file->getClientOriginalExtension();

        $path = "/uploads/{$folder}/{$filename}";

        Storage::disk('public')->put(
            $path,
            file_get_contents($file)
        );

        // delete old file
        if ($oldFile) {
            Storage::disk('public')->delete($oldFile);
        }

        return $path;
    }

    /**
     * DELETE SINGLE
     */
    public static function delete(?string $path): void
    {
        if ($path && Storage::disk('public')->exists($path)) {
            Storage::disk('public')->delete($path);
        }
    }

    /**
     * DELETE MULTIPLE
     */
    public static function deleteMultiple(array $paths): void
    {
        foreach ($paths as $path) {
            if ($path && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
    }

    /**
     * GET URL
     */
    public static function url(?string $path): ?string
    {
        return $path ? Storage::url($path) : null;
    }
}

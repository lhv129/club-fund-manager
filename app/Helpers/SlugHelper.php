<?php

namespace App\Helpers;

use Illuminate\Support\Str;

class SlugHelper
{
    public static function createSlug(string $name): string
    {
        return Str::slug($name);
    }
}

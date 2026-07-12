<?php

namespace App\Base\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Kiểm tra mảng translations phải có đủ tất cả locale trong config.
 *
 * Dùng:
 *   'translations' => ['required', 'array', new RequiredLocales],
 *
 * Mặc định đọc config('app.supported_locales').
 * Truyền danh sách locale tuỳ ý: new RequiredLocales(['vi', 'en'])
 */
class RequiredLocales implements ValidationRule
{
    protected array $required;

    public function __construct(?array $locales = null)
    {
        $this->required = $locales ?? config('app.supported_locales', []);
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_array($value)) {
            $fail(__('validation.array', ['attribute' => $attribute]));
            return;
        }

        // Locale code là key của array, không phải field bên trong
        $provided = array_keys($value);            // ← đổi từ array_column($value, 'locale')
        $missing  = array_diff($this->required, $provided);

        if (!empty($missing)) {
            $fail(__('validation.required_locales', [
                'locales' => implode(', ', $missing),
            ]));
        }
    }
}

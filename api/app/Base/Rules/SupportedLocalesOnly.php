<?php

namespace App\Base\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

class SupportedLocalesOnly implements ValidationRule
{
    protected array $allowed;

    public function __construct(?array $locales = null)
    {
        $this->allowed = $locales ?? config('app.supported_locales', []);
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_array($value)) {
            return;
        }

        $invalid = array_diff(array_keys($value), $this->allowed);

        if (!empty($invalid)) {
            $fail(__('validation.unsupported_locales', [
                'locales' => implode(', ', $invalid),
            ]));
        }
    }
}

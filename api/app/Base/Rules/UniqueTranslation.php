<?php

namespace App\Base\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Contracts\Validation\ValidatorAwareRule;
use Illuminate\Support\Facades\DB;

/**
 * Kiểm tra name (hoặc title) unique per locale trong bảng translation.
 *
 * Dùng ValidatorAwareRule để gắn lỗi đúng field (translations.0.name),
 * đi qua failedValidation() của BaseRequest → response 422 chuẩn.
 *
 * Store:
 *   new UniqueTranslation('club_translations')
 *
 * Update:
 *   new UniqueTranslation('club_translations', excludeParentId: $id, fkColumn: 'club_id')
 */
class UniqueTranslation implements ValidationRule, ValidatorAwareRule
{
    protected \Illuminate\Validation\Validator $validator;

    public function __construct(
        private string $translationTable,
        private string $nameField       = 'name',
        private ?int   $excludeParentId = null,
        private string $fkColumn        = '',
    ) {}

    public function setValidator($validator): static
    {
        $this->validator = $validator;
        return $this;
    }

    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (!is_array($value)) {
            return;
        }

        $hasError = false;

        foreach ($value as $index => $translation) {
            $locale = $translation['locale']         ?? null;
            $name   = $translation[$this->nameField] ?? null;

            if (!$locale || !$name) {
                continue;
            }

            $exists = DB::table($this->translationTable)
                ->where($this->nameField, $name)
                ->where('locale', $locale)
                ->when(
                    $this->excludeParentId && $this->fkColumn,
                    fn($q) => $q->where($this->fkColumn, '!=', $this->excludeParentId)
                )
                ->exists();

            if ($exists) {
                // Gắn lỗi đúng field user nhập: translations.0.name
                $this->validator->errors()->add(
                    "translations.{$index}.{$this->nameField}",
                    __('validation.translation_name_taken', ['locale' => $locale]),
                );
                $hasError = true;
            }
        }
    }
}

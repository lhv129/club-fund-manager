<?php

namespace App\Domains\Module\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\RequiredLocales;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;
use Illuminate\Validation\Rule;

class StoreModuleRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'slug' => [
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9_-]+$/',
                Rule::unique('modules', 'slug')
                    ->whereNull('deleted_at'),
            ],
            'icon'       => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'  => ['boolean'],

            'translations' => [
                'required',
                'array',
                new RequiredLocales,
                new SupportedLocalesOnly,
                new UniqueTranslation('module_translations'),
            ],
            'translations.*'      => ['array'],
            'translations.*.name' => ['required', 'string', 'max:255'],

            // Actions tự động tạo permissions khi tạo module
            'actions'   => ['required', 'array', 'min:1'],
            'actions.*' => [
                'required',
                'string',
                Rule::in(['view', 'create', 'update', 'delete']),
            ],
        ];
    }

    public function attributes(): array
    {
        return $this->translationAttributes('module', ['name']);
    }
}

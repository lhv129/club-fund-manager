<?php

namespace App\Domains\Module\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\RequiredLocales;
use Illuminate\Validation\Rule;

class StoreModuleRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'slug'       => ['required', 'string', 'max:255', Rule::unique('modules', 'slug')],
            'icon'       => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'  => ['boolean'],

            'translations' => [
                'required',
                'array',
                new RequiredLocales,
            ],
            'translations.*.locale'      => ['required', 'string', 'max:5', Rule::in(config('app.supported_locales'))],
            'translations.*.name'        => ['required', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
        ];
    }
}

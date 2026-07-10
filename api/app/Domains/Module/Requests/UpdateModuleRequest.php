<?php

namespace App\Domains\Module\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateModuleRequest extends BaseRequest
{
    public function rules(): array
    {
        $moduleId = (int) $this->route('module'); // hoặc $this->route('id')

        return [
            'slug'       => ['sometimes', 'required', 'string', 'max:255', Rule::unique('modules', 'slug')->ignore($moduleId)],
            'icon'       => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'  => ['sometimes', 'boolean'],

            'translations' => [
                'sometimes',
                'array',
                'min:1',
            ],
            'translations.*.locale'      => ['required_with:translations', 'string', 'max:5', Rule::in(config('app.supported_locales'))],
            'translations.*.name'        => ['required_with:translations', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string'],
        ];
    }
}

<?php

namespace App\Domains\Module\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;
use Illuminate\Validation\Rule;

class UpdateModuleRequest extends BaseRequest
{
    public function rules(): array
    {
        $moduleId = (int) $this->route('id');

        return [
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9_-]+$/',
                Rule::unique('modules', 'slug')
                    ->ignore($moduleId)
                    ->whereNull('deleted_at'),
            ],
            'icon'       => ['nullable', 'string', 'max:100'],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'  => ['sometimes', 'boolean'],

            'translations' => [
                'sometimes',
                'array',
                'min:1',
                new SupportedLocalesOnly,
                new UniqueTranslation(
                    translationTable: 'module_translations',
                    excludeParentId: $moduleId,
                    fkColumn: 'module_id',
                ),
            ],
            'translations.*'      => ['array'],
            'translations.*.name' => ['required', 'string', 'max:255'],

            'actions'   => ['sometimes', 'array'],
            'actions.*' => ['string', Rule::in(['view', 'create', 'update', 'delete'])],
        ];
    }

    public function attributes(): array
    {
        return $this->translationAttributes('module', ['name']);
    }
}

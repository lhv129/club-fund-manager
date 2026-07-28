<?php

namespace App\Domains\Role\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $roleId = (int) $this->route('id');

        return [
            'slug' => [
                'sometimes',
                'required',
                'string',
                'max:100',
                'regex:/^[a-z0-9_-]+$/',
                Rule::unique('modules', 'slug')
                    ->ignore($roleId)
                    ->whereNull('deleted_at'),
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
                'max:999',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'translations' => [
                'sometimes',
                'array',
                'min:1',
                new SupportedLocalesOnly,
                new UniqueTranslation(
                    translationTable: 'role_translations',
                    excludeParentId: $roleId,
                    fkColumn: 'role_id',
                ),
            ],
            'translations.*'      => ['array'],
            'translations.*.name' => ['required', 'string', 'max:255'],
            'translations.*.description' => ['nullable', 'string', 'max:255'],
        ];
    }
}

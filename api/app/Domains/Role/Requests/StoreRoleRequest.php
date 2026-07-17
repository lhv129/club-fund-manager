<?php

namespace App\Domains\Role\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\RequiredLocales;
use Illuminate\Validation\Rule;

class StoreRoleRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $clubId = $this->input('club_id'); // null = system role

        return [
            'club_id'    => ['nullable', 'integer', 'exists:clubs,id'],
            'slug'       => [
                'required',
                'string',
                'max:255',
                // slug unique trong phạm vi club (null club_id = system role)
                Rule::unique('roles', 'slug')->where('club_id', $clubId),
            ],
            'sort_order'     => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'      => ['boolean'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],

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

<?php

namespace App\Domains\Role\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends BaseRequest
{
    public function rules(): array
    {
        $roleId = (int) $this->route('role'); // hoặc $this->route('id')
        $clubId = $this->input('club_id');

        return [
            'club_id'    => ['nullable', 'integer', 'exists:clubs,id'],
            'slug'       => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('roles', 'slug')
                    ->where('club_id', $clubId)
                    ->ignore($roleId),
            ],
            'sort_order'     => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'      => ['sometimes', 'boolean'],
            'permission_ids' => ['nullable', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],

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

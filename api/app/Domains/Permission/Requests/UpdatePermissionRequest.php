<?php

namespace App\Domains\Permission\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdatePermissionRequest extends BaseRequest
{
    public function rules(): array
    {
        $permissionId = (int) $this->route('permission'); // hoặc $this->route('id')
        $moduleId     = $this->input('module_id');

        return [
            'module_id'  => ['sometimes', 'required', 'integer', 'exists:modules,id'],
            'action'     => [
                'sometimes',
                'required',
                'string',
                Rule::in(['view', 'create', 'update', 'delete']),
                Rule::unique('permissions', 'action')
                    ->where('module_id', $moduleId)
                    ->ignore($permissionId),
            ],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'  => ['sometimes', 'boolean'],

            'translations' => [
                'sometimes',
                'array',
                'min:1',
            ],
            'translations.*.locale' => ['required_with:translations', 'string', 'max:5', Rule::in(config('app.supported_locales'))],
            'translations.*.name'   => ['required_with:translations', 'string', 'max:255'],
        ];
    }
}

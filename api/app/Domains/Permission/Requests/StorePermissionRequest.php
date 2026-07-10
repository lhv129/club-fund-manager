<?php

namespace App\Domains\Permission\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\RequiredLocales;
use Illuminate\Validation\Rule;

class StorePermissionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'module_id'  => ['required', 'integer', 'exists:modules,id'],
            'action'     => [
                'required',
                'string',
                Rule::in(['view', 'create', 'update', 'delete']),
                // unique(module_id, action)
                Rule::unique('permissions', 'action')->where('module_id', $this->input('module_id')),
            ],
            'sort_order' => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'  => ['boolean'],

            'translations' => [
                'required',
                'array',
                new RequiredLocales,
            ],
            'translations.*.locale' => ['required', 'string', 'max:5', Rule::in(config('app.supported_locales'))],
            'translations.*.name'   => ['required', 'string', 'max:255'],
        ];
    }
}

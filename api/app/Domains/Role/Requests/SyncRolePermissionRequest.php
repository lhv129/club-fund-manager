<?php

namespace App\Domains\Role\Requests;

use App\Base\BaseRequest;

class SyncRolePermissionRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'permissions' => [
                'required',
                'array',
            ],

            'permissions.*' => [
                'integer',
                'exists:permissions,id',
                'distinct',
            ],

        ];
    }
}

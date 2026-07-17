<?php

namespace App\Domains\Role\Requests;

use App\Base\BaseRequest;

class AssignPermissionRequest extends BaseRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'slug' => 'required|exists:roles,slug',
            'permission_ids' => 'required|array|min:1',
            'permission_ids.*' => 'exists:permissions,id'
        ];
    }
}

<?php

namespace App\Domains\Role\Requests;

use App\Base\BaseRequest;

class FilterRoleRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'club_id'   => ['nullable', 'integer', 'exists:clubs,id'],
            'is_active' => ['nullable', 'boolean'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:id,sort_order,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }
}

<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

class FilterClubInviteRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'is_active' => ['nullable', 'boolean'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:id,sort_order,created_at,expires_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }
}

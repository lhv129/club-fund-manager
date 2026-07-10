<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

class FilterClubMemberRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'status'    => ['nullable', 'string', 'in:pending,approved,rejected'],
            'join_type' => ['nullable', 'string', 'in:request,invite'],
            'is_active' => ['nullable', 'boolean'],
            'search'    => ['nullable', 'string', 'max:255'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:id,joined_at,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }
}

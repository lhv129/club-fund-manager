<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

class FilterClubRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'limit'  => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ];
    }
}

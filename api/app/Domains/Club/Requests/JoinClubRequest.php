<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

    class JoinClubRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'token' => ['required', 'string', 'size:64'],
        ];
    }
}

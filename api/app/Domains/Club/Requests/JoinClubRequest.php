<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

    class JoinClubRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'invite_code' => ['required', 'string', 'size:6'],
        ];
    }
}

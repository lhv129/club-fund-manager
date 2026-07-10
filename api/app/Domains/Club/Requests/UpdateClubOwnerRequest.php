<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

class UpdateClubOwnerRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }
}
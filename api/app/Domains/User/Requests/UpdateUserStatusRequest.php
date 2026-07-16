<?php

namespace App\Domains\User\Requests;

use App\Base\BaseRequest;

class UpdateUserStatusRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'status' => ['required', 'string', 'in:active,inactive,locked'],
        ];
    }
}

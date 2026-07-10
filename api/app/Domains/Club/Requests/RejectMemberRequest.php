<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

class RejectMemberRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'rejected_reason' => ['nullable', 'string', 'max:1000'],
        ];
    }
}

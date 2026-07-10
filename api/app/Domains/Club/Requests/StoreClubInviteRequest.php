<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

class StoreClubInviteRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'expires_at'  => ['nullable', 'date', 'after:now'],
            'sort_order'  => ['nullable', 'integer', 'min:0', 'max:999'],
            'is_active'   => ['boolean'],
        ];
    }
}

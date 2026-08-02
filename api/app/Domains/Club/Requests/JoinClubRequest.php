<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

class JoinClubRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'club_slug' => 'nullable|string|exists:club_translations,slug',
            'invite_code' => ['nullable', 'string', 'size:6'],
        ];
    }
}

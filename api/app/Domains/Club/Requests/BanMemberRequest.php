<?php

namespace App\Domains\Club\Requests;

use App\Base\BaseRequest;

class BanMemberRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'club_slug' => 'nullable|exists:club_translations,slug',
            'banned_reason' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }
}
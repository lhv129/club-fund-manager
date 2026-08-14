<?php

namespace App\Domains\FundPeriod\Requests;

use App\Base\BaseRequest;

class ReopenFundPeriodRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'club_slug' => 'nullable|exists:club_translations,slug',
            'reason' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }
}

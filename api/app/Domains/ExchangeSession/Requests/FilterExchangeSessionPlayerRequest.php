<?php

namespace App\Domains\ExchangeSession\Requests;

use App\Base\BaseRequest;

class FilterExchangeSessionPlayerRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id'      => ['nullable', 'integer', 'min:1'],
            'paid'          => ['nullable', 'boolean'],
            'checked_in'    => ['nullable', 'boolean'],
            'is_active'      => ['nullable', 'boolean'],
            'limit'         => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'          => ['nullable', 'integer', 'min:1'],
            'sort_by'       => ['nullable', 'string', 'in:id,amount,sort_order,created_at'],
            'sort_dir'      => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'user_id'     => __('domains/exchange_session.attributes.player_user_id'),
            'paid'        => __('domains/exchange_session.attributes.player_paid'),
            'checked_in'  => __('domains/exchange_session.attributes.player_checked_in'),
            'is_active'    => __('domains/exchange_session.attributes.is_active'),
        ];
    }
}

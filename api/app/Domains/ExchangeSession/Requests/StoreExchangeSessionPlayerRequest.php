<?php

namespace App\Domains\ExchangeSession\Requests;

use App\Base\BaseRequest;

class StoreExchangeSessionPlayerRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id'      => ['nullable', 'integer', 'exists:users,id'],
            'player_name'   => ['nullable', 'string', 'max:255'],
            'amount'        => ['nullable', 'numeric', 'min:0'],
            'paid'          => ['nullable', 'boolean'],
            'checked_in'    => ['nullable', 'boolean'],
            'is_active'      => ['nullable', 'boolean'],
            'sort_order'    => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'user_id'     => __('domains/exchange_session.attributes.player_user_id'),
            'player_name' => __('domains/exchange_session.attributes.player_name'),
            'amount'      => __('domains/exchange_session.attributes.player_amount'),
            'paid'        => __('domains/exchange_session.attributes.player_paid'),
            'checked_in'  => __('domains/exchange_session.attributes.player_checked_in'),
        ];
    }
}

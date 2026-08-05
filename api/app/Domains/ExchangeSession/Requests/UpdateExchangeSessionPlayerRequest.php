<?php

namespace App\Domains\ExchangeSession\Requests;

use App\Base\BaseRequest;

class UpdateExchangeSessionPlayerRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id'      => ['sometimes', 'nullable', 'integer', 'exists:users,id'],
            'player_name'   => ['sometimes', 'nullable', 'string', 'max:255'],
            'amount'        => ['sometimes', 'nullable', 'numeric', 'min:0'],
            'paid'          => ['sometimes', 'boolean'],
            'checked_in'    => ['sometimes', 'boolean'],
            'is_active'      => ['sometimes', 'boolean'],
            'sort_order'    => ['sometimes', 'integer', 'min:0'],
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

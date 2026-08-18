<?php

namespace App\Domains\ExchangeSession\Requests;

use App\Base\BaseRequest;

class FilterExchangeSessionPlayersRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],
            'exchange_session_id' => ['nullable', 'integer', 'exists:exchange_sessions,id'],
            'user_id' => ['nullable', 'integer', 'min:1'],
            'paid' => ['nullable', 'boolean'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
            'sort_by' => ['nullable', 'string', 'in:session_date,amount,paid,sort_order,created_at'],
            'sort_dir' => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'exchange_session_id' => __('domains/exchange_session.attributes.exchange_session_id'),
            'search' => __('domains/exchange_session.attributes.search'),
            'paid' => __('domains/exchange_session.attributes.paid'),
            'limit' => __('domains/exchange_session.attributes.limit'),
            'page' => __('domains/exchange_session.attributes.page'),
            'sort_by' => __('domains/exchange_session.attributes.sort_by'),
            'sort_dir' => __('domains/exchange_session.attributes.sort_dir'),
        ];
    }
}

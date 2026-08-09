<?php

namespace App\Domains\ExchangeSession\Requests;

use App\Base\BaseRequest;

class FilterExchangeSessionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search'                => ['nullable', 'string', 'max:255'],
            'playing_schedule_id'    => ['nullable', 'integer', 'min:1'],
            'status'                => ['nullable', 'in:upcoming,completed,cancelled'],
            'type'                  => ['nullable', 'in:scheduled,manual'],
            'is_active'             => ['nullable', 'boolean'],
            'session_date_from'     => ['nullable', 'date'],
            'session_date_to'       => ['nullable', 'date', 'after_or_equal:session_date_from'],
            'limit'                 => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'                  => ['nullable', 'integer', 'min:1'],
            'sort_by'               => ['nullable', 'string', 'in:id,session_date,status,type,sort_order,created_at'],
            'sort_dir'              => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'playing_schedule_id'    => __('domains/exchange_session.attributes.playing_schedule_id'),
            'status'                => __('domains/exchange_session.attributes.status'),
            'type'                  => __('domains/exchange_session.attributes.type'),
            'is_active'             => __('domains/exchange_session.attributes.is_active'),
            'session_date'          => __('domains/exchange_session.attributes.session_date'),
        ];
    }
}

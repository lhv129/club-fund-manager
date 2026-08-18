<?php

namespace App\Domains\ExchangeSession\Requests;

use App\Base\BaseRequest;

class StoreExchangeSessionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'playing_schedule_id'  => ['nullable', 'integer', 'exists:playing_schedules,id'],
            'transaction_id' => ['nullable', 'integer', 'exists:transactions,id'],
            'session_date' => ['required', 'date'],
            'court_name'            => ['nullable', 'string', 'max:255'],
            'court_address'         => ['nullable', 'string', 'max:500'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time'   => ['required', 'date_format:H:i', 'after:start_time'],
            'type'                  => ['nullable', 'in:scheduled,manual'],
            'status'                => ['nullable', 'in:upcoming,completed,cancelled'],
            'player_count'          => ['nullable', 'integer', 'min:0'],
            'amount_per_player'     => ['nullable', 'numeric', 'min:0'],
            'total_amount'          => ['nullable', 'numeric', 'min:0'],
            'is_active'              => ['nullable', 'boolean'],
            'sort_order'            => ['nullable', 'integer', 'min:0'],

        ];
    }

    public function attributes(): array
    {
        return [
                'club_id'               => __('domains/exchange_session.attributes.club_id'),
                'playing_schedule_id'    => __('domains/exchange_session.attributes.playing_schedule_id'),
                'transaction_id'          => __('domains/exchange_session.attributes.transaction_id'),
                'session_date'            => __('domains/exchange_session.attributes.session_date'),
                'court_name'              => __('domains/exchange_session.attributes.court_name'),
                'court_address'           => __('domains/exchange_session.attributes.court_address'),
                'start_time'              => __('domains/exchange_session.attributes.start_time'),
                'end_time'                => __('domains/exchange_session.attributes.end_time'),
                'type'                    => __('domains/exchange_session.attributes.type'),
                'status'                  => __('domains/exchange_session.attributes.status'),
                'player_count'            => __('domains/exchange_session.attributes.player_count'),
                'amount_per_player'       => __('domains/exchange_session.attributes.amount_per_player'),
                'total_amount'            => __('domains/exchange_session.attributes.total_amount'),
                'is_active'                => __('domains/exchange_session.attributes.is_active'),
                'sort_order'              => __('domains/exchange_session.attributes.sort_order'),
        ];
    }
}

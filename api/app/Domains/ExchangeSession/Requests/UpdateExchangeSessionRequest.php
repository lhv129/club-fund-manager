<?php

namespace App\Domains\ExchangeSession\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;

class UpdateExchangeSessionRequest extends BaseRequest
{
    public function rules(): array
    {
        $id = (int) $this->route('id');

        return [
            'club_id'             => ['sometimes', 'required', 'integer', 'exists:clubs,id'],
            'playing_schedule_id'  => ['sometimes', 'nullable', 'integer', 'exists:playing_schedules,id'],
            'transaction_id'        => ['sometimes', 'nullable', 'integer', 'exists:transactions,id'],
            'session_date'          => ['sometimes', 'required', 'date'],
            'court_name'            => ['sometimes', 'nullable', 'string', 'max:255'],
            'court_address'         => ['sometimes', 'nullable', 'string', 'max:500'],
            'start_time'            => ['sometimes', 'required', 'date_format:H:i'],
            'end_time'              => ['sometimes', 'required', 'date_format:H:i', 'after:start_time'],
            'type'                  => ['sometimes', 'in:scheduled,manual'],
            'status'                => ['sometimes', 'in:upcoming,completed,cancelled'],
            'player_count'          => ['sometimes', 'integer', 'min:0'],
            'amount_per_player'     => ['sometimes', 'numeric', 'min:0'],
            'total_amount'          => ['sometimes', 'numeric', 'min:0'],
            'is_active'              => ['sometimes', 'boolean'],
            'sort_order'            => ['sometimes', 'integer', 'min:0'],

            'translations' => [
                'sometimes',
                'array',
                'min:1',
                new SupportedLocalesOnly,
                new UniqueTranslation(
                    translationTable: 'exchange_session_translations',
                    nameField: 'title',
                    excludeParentId: $id,
                    fkColumn: 'exchange_session_id',
                ),
            ],
            'translations.*'             => ['array'],
            'translations.*.title'        => ['required', 'string', 'max:255'],
            'translations.*.note'         => ['nullable', 'string', 'max:3000'],
        ];
    }

    public function attributes(): array
    {
        return array_merge(
            [
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
            ],
            $this->translationAttributes('exchange_session', ['title', 'note']),
        );
    }
}

<?php

namespace App\Domains\PlayingSchedule\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;

class UpdatePlayingScheduleRequest extends BaseRequest
{
    public function rules(): array
    {
        $id = (int) $this->route('id');

        return [
            'weekday'         => ['sometimes', 'required', 'integer', 'min:0', 'max:6'],
            'court_name'      => ['sometimes', 'nullable', 'string', 'max:255'],
            'court_address'   => ['sometimes', 'nullable', 'string', 'max:500'],
            'start_time' => ['sometimes', 'date_format:H:i:s'],
            'end_time'   => ['sometimes', 'date_format:H:i:s', 'after:start_time'],
            'auto_generate'   => ['sometimes', 'boolean'],
            'weeks_ahead'     => ['sometimes', 'integer', 'min:1', 'max:52'],
            'start_date'      => ['sometimes', 'nullable', 'date'],
            'end_date'        => ['sometimes', 'nullable', 'date', 'after_or_equal:start_date'],
            'is_active'        => ['sometimes', 'boolean'],
            'sort_order'      => ['sometimes', 'integer', 'min:0'],

            'translations' => [
                'sometimes',
                'array',
                'min:1',
                new SupportedLocalesOnly,
                new UniqueTranslation(
                    translationTable: 'playing_schedule_translations',
                    nameField: 'title',
                    excludeParentId: $id,
                    fkColumn: 'playing_schedule_id',
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
                'weekday'        => __('domains/playing_schedule.attributes.weekday'),
                'court_name'     => __('domains/playing_schedule.attributes.court_name'),
                'court_address'  => __('domains/playing_schedule.attributes.court_address'),
                'start_time'     => __('domains/playing_schedule.attributes.start_time'),
                'end_time'       => __('domains/playing_schedule.attributes.end_time'),
                'auto_generate'  => __('domains/playing_schedule.attributes.auto_generate'),
                'weeks_ahead'    => __('domains/playing_schedule.attributes.weeks_ahead'),
                'start_date'     => __('domains/playing_schedule.attributes.start_date'),
                'end_date'       => __('domains/playing_schedule.attributes.end_date'),
                'is_active'       => __('domains/playing_schedule.attributes.is_active'),
                'sort_order'     => __('domains/playing_schedule.attributes.sort_order'),
            ],
            $this->translationAttributes('playing_schedule', ['title', 'note']),
        );
    }
}

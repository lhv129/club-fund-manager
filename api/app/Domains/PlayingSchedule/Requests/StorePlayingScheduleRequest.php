<?php

namespace App\Domains\PlayingSchedule\Requests;

use App\Base\BaseRequest;
use App\Base\Rules\RequiredLocales;
use App\Base\Rules\SupportedLocalesOnly;
use App\Base\Rules\UniqueTranslation;

class StorePlayingScheduleRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'club_id'        => ['required', 'integer', 'exists:clubs,id'],
            'weekday'         => ['required', 'integer', 'min:0', 'max:6'],
            'court_name'      => ['nullable', 'string', 'max:255'],
            'court_address'   => ['nullable', 'string', 'max:500'],
            'start_time'      => ['required', 'date_format:H:i'],
            'end_time'        => ['required', 'date_format:H:i', 'after:start_time'],
            'auto_generate'   => ['nullable', 'boolean'],
            'weeks_ahead'     => ['nullable', 'integer', 'min:1', 'max:52'],
            'start_date'      => ['nullable', 'date'],
            'end_date'        => ['nullable', 'date', 'after_or_equal:start_date'],
            'is_active'        => ['nullable', 'boolean'],
            'sort_order'      => ['nullable', 'integer', 'min:0'],

            'translations' => [
                'required',
                'array',
                new RequiredLocales,
                new SupportedLocalesOnly,
                new UniqueTranslation('playing_schedule_translations', nameField: 'title'),
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
                'club_id'       => __('domains/playing_schedule.attributes.club_id'),
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

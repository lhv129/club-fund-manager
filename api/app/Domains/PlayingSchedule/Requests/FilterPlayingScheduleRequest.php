<?php

namespace App\Domains\PlayingSchedule\Requests;

use App\Base\BaseRequest;

class FilterPlayingScheduleRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'club_id'   => ['nullable', 'integer', 'min:1'],
            'weekday'   => ['nullable', 'integer', 'min:0', 'max:6'],
            'is_active' => ['nullable', 'boolean'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:id,weekday,sort_order,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'club_id'   => __('domains/playing_schedule.attributes.club_id'),
            'weekday'    => __('domains/playing_schedule.attributes.weekday'),
            'is_active' => __('domains/playing_schedule.attributes.is_active'),
        ];
    }
}

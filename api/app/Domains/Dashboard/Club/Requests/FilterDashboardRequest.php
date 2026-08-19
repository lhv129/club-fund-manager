<?php

namespace App\Domains\Dashboard\Club\Requests;

use App\Base\BaseRequest;

class FilterDashboardRequest extends BaseRequest
{
    /**
     * Whitelist sort_by chống cột lạ xuống Query Builder (mục 13 api-overview.md).
     */
    public function rules(): array
    {
        return [
            'club_slug' => 'nullable|exists:club_translations,slug',
            'period' => ['nullable', 'string', 'in:last_year,6m,3m,previous_month,previous_week,month,custom'],
            'date_from' => ['nullable', 'required_if:period,custom', 'date', 'date_format:Y-m-d', 'before_or_equal:date_to'],
            'date_to'   => ['nullable', 'required_if:period,custom', 'date', 'date_format:Y-m-d', 'after_or_equal:date_from'],
            'granularity' => ['nullable', 'string', 'in:day,month'],
        ];
    }

    public function attributes(): array
    {
        return [
            'period'    => __('domains/dashboard.attributes.period'),
            'date_from' => __('domains/dashboard.attributes.date_from'),
            'date_to'   => __('domains/dashboard.attributes.date_to'),
        ];
    }
}

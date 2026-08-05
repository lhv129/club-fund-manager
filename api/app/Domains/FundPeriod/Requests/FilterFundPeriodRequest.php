<?php

namespace App\Domains\FundPeriod\Requests;

use App\Base\BaseRequest;

class FilterFundPeriodRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'club_id'   => ['nullable', 'integer', 'min:1'],
            'year'      => ['nullable', 'integer', 'min:2000', 'max:2100'],
            'month'     => ['nullable', 'integer', 'min:1', 'max:12'],
            'is_active' => ['nullable', 'boolean'],
            'is_locked' => ['nullable', 'boolean'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:id,year,month,sort_order,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'club_id'    => __('domains/fund_period.attributes.club_id'),
            'year'        => __('domains/fund_period.attributes.year'),
            'month'       => __('domains/fund_period.attributes.month'),
            'is_active'   => __('domains/fund_period.attributes.is_active'),
            'is_locked'   => __('domains/fund_period.attributes.is_locked'),
        ];
    }
}

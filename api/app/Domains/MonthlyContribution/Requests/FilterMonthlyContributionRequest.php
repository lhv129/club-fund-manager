<?php

namespace App\Domains\MonthlyContribution\Requests;

use App\Base\BaseRequest;

class FilterMonthlyContributionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            // 'club_id'   => ['nullable', 'integer', 'min:1'],
            'period_id' => ['nullable', 'integer', 'min:1'],
            'user_id'   => ['nullable', 'integer', 'min:1'],
            'status'    => ['nullable', 'string', 'in:pending,paid,cancelled'],
            'paid_by'   => ['nullable', 'string', 'in:bank,cash,manual'],
            'is_active' => ['nullable', 'boolean'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:id,amount,payment_date,sort_order,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            // 'club_id'   => __('domains/monthly_contribution.attributes.club_id'),
            'period_id' => __('domains/monthly_contribution.attributes.period_id'),
            'user_id'   => __('domains/monthly_contribution.attributes.user_id'),
            'status'    => __('domains/monthly_contribution.attributes.status'),
            'paid_by'   => __('domains/monthly_contribution.attributes.paid_by'),
            'is_active' => __('domains/monthly_contribution.attributes.is_active'),
        ];
    }
}

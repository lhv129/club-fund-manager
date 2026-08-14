<?php

namespace App\Domains\MonthlyContribution\Requests;

use App\Base\BaseRequest;

class UpdateMonthlyContributionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id' => ['required', 'integer', 'min:1', 'exists:users,id'],
            'period_id' => ['required', 'integer', 'min:1', 'exists:fund_periods,id'],
            'status' => ['nullable', 'string', 'in:pending,paid,cancelled'],
            'paid_by' => ['sometimes', 'nullable', 'string', 'in:cash'],
            'payment_date' => ['nullable', 'date'],
        ];
    }

    public function attributes(): array
    {
        return [
            'user_id' => __('domains/monthly_contribution.attributes.user_id'),
            'period_id' => __('domains/monthly_contribution.attributes.period_id'),
            'status' => __('domains/monthly_contribution.attributes.status'),
            'paid_by' => __('domains/monthly_contribution.attributes.paid_by'),
            'payment_date' => __('domains/monthly_contribution.attributes.payment_date'),
        ];
    }
}

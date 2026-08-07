<?php

namespace App\Domains\MonthlyContribution\Requests;

use App\Base\BaseRequest;

class StoreMonthlyContributionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'user_id'        => ['required', 'integer', 'min:1', 'exists:users,id'],
            'period_id'      => ['required', 'integer', 'min:1', 'exists:fund_periods,id'],
            'transaction_id' => ['nullable', 'integer', 'min:1', 'exists:transactions,id'],
            'status'         => ['nullable', 'string', 'in:pending,paid,cancelled'],
            'paid_by'        => ['nullable', 'string', 'in:bank,cash,manual', 'required_if:status,paid'],
            'payment_date'   => ['nullable', 'date', 'required_if:status,paid']
        ];
    }

    public function attributes(): array
    {
        return [
            'club_id'        => __('domains/monthly_contribution.attributes.club_id'),
            'user_id'        => __('domains/monthly_contribution.attributes.user_id'),
            'period_id'      => __('domains/monthly_contribution.attributes.period_id'),
            'transaction_id' => __('domains/monthly_contribution.attributes.transaction_id'),
            'amount'         => __('domains/monthly_contribution.attributes.amount'),
            'status'         => __('domains/monthly_contribution.attributes.status'),
            'paid_by'        => __('domains/monthly_contribution.attributes.paid_by'),
            'payment_date'   => __('domains/monthly_contribution.attributes.payment_date'),
        ];
    }
}

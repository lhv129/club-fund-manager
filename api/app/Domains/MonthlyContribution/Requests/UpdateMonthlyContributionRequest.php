<?php

namespace App\Domains\MonthlyContribution\Requests;

use App\Base\BaseRequest;

class UpdateMonthlyContributionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'transaction_id' => ['nullable', 'integer', 'min:1', 'exists:transactions,id'],
            'amount'         => ['nullable', 'numeric', 'min:0'],
            'status'         => ['nullable', 'string', 'in:pending,paid,cancelled'],
            'paid_by'        => ['nullable', 'string', 'in:bank,cash,manual'],
            'payment_date'   => ['nullable', 'date'],
            'sort_order'     => ['nullable', 'integer', 'min:0'],
            'is_active'      => ['nullable', 'boolean'],
        ];
    }

    public function attributes(): array
    {
        return [
            'transaction_id' => __('domains/monthly_contribution.attributes.transaction_id'),
            'amount'         => __('domains/monthly_contribution.attributes.amount'),
            'status'         => __('domains/monthly_contribution.attributes.status'),
            'paid_by'        => __('domains/monthly_contribution.attributes.paid_by'),
            'payment_date'   => __('domains/monthly_contribution.attributes.payment_date'),
        ];
    }
}

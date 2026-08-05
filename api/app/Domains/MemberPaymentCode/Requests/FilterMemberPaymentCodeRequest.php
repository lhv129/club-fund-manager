<?php

namespace App\Domains\MemberPaymentCode\Requests;

use App\Base\BaseRequest;

class FilterMemberPaymentCodeRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'monthly_contribution_id' => ['nullable', 'integer', 'min:1'],
            'status'                  => ['nullable', 'in:pending,used,expired'],
            'is_active'               => ['nullable', 'boolean'],
            'limit'                   => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'                    => ['nullable', 'integer', 'min:1'],
            'sort_by'                 => ['nullable', 'string', 'in:id,status,expired_at,created_at'],
            'sort_dir'                => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'monthly_contribution_id' => __('domains/member_payment_code.attributes.monthly_contribution_id'),
            'status'                 => __('domains/member_payment_code.attributes.status'),
            'is_active'               => __('domains/member_payment_code.attributes.is_active'),
        ];
    }
}

<?php

namespace App\Domains\BankAccount\Requests;

use App\Base\BaseRequest;

class FilterBankAccountRequest extends BaseRequest
{
    /**
     * Whitelist sort_by chống cột lạ xuống Query Builder (mục 13 api-overview.md).
     */
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'user_id'   => ['nullable', 'integer', 'min:1'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:id,title,sort_order,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'title'       => __('domains/bank_account.attributes.title'),
            'description' => __('domains/bank_account.attributes.description'),
            'is_active'   => __('domains/bank_account.attributes.is_active'),
            'user_id'     => 'user',
        ];
    }
}

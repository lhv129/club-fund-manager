<?php

namespace App\Domains\Bank\Requests;

use App\Base\BaseRequest;

class FilterBankRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],

            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],

            'sort_by'   => ['nullable', 'string', 'in:id,code,name,short_name,sort_order,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code'       => __('domains/bank.attributes.code'),
            'name'       => __('domains/bank.attributes.name'),
            'short_name' => __('domains/bank.attributes.short_name'),
            'bin'        => __('domains/bank.attributes.bin'),
            'swift_code' => __('domains/bank.attributes.swift_code'),
            'is_active'  => __('domains/bank.attributes.is_active'),
            'sort_order' => __('domains/bank.attributes.sort_order'),
        ];
    }
}

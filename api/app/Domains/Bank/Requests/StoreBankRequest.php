<?php

namespace App\Domains\Bank\Requests;

use App\Base\BaseRequest;

class StoreBankRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'code'       => ['required', 'string', 'max:20', 'unique:banks,code'],
            'name'       => ['required', 'string', 'max:255'],
            'short_name' => ['nullable', 'string', 'max:255'],

            'logo'       => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            'bin'        => ['nullable', 'string', 'max:10'],
            'swift_code' => ['nullable', 'string', 'max:50'],

            'is_active'  => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'code'       => __('domains/bank.attributes.code'),
            'name'       => __('domains/bank.attributes.name'),
            'short_name' => __('domains/bank.attributes.short_name'),
            'logo'       => __('domains/bank.attributes.logo'),
            'bin'        => __('domains/bank.attributes.bin'),
            'swift_code' => __('domains/bank.attributes.swift_code'),
            'is_active'  => __('domains/bank.attributes.is_active'),
            'sort_order' => __('domains/bank.attributes.sort_order'),
        ];
    }
}

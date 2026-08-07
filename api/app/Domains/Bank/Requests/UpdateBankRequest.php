<?php

namespace App\Domains\Bank\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateBankRequest extends BaseRequest
{
    public function rules(): array
    {
        $id = $this->route('id');

        return [
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:20',
                Rule::unique('banks', 'code')->ignore($id),
            ],

            'name'       => ['sometimes', 'required', 'string', 'max:255'],
            'short_name' => ['sometimes', 'nullable', 'string', 'max:255'],

            'logo'       => ['sometimes', 'nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            'bin'        => ['sometimes', 'nullable', 'string', 'max:10'],
            'swift_code' => ['sometimes', 'nullable', 'string', 'max:50'],

            'is_active'  => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
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

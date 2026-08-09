<?php

namespace App\Domains\Bank\Requests;

use App\Base\BaseRequest;

class UpdateBankAccountRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'bank_id' => [
                'sometimes',
                'required',
                'integer',
                'exists:banks,id',
            ],

            'account_number' => [
                'sometimes',
                'required',
                'string',
                'max:30',
            ],

            'account_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
            ],

            'qr_image' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'sort_order' => [
                'sometimes',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'sometimes',
                'boolean',
            ],

            'is_default' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    public function attributes(): array
    {
        return [
            'bank_id' => __('domains/bank_account.attributes.bank_id'),
            'account_name' => __('domains/bank_account.attributes.account_name'),
            'account_number' => __('domains/bank_account.attributes.account_number'),
            'is_default' => __('domains/bank_account.attributes.is_default'),
        ];
    }
}

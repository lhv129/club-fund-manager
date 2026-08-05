<?php

namespace App\Domains\BankAccount\Requests;

use App\Base\BaseRequest;

class UpdateBankAccountRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'club_id' => ['required', 'integer', 'exists:clubs,id'],
            'bank_name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
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
        ];
    }

    public function attributes(): array
    {
        return [
            'bank_name' => __('domains/bank_account.attributes.bank_name'),
            'account_name' => __('domains/bank_account.attributes.account_name'),
            'account_number' => __('domains/bank_account.attributes.account_number'),
        ];
    }
}

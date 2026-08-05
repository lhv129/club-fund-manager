<?php

namespace App\Domains\BankAccount\Requests;

use App\Base\BaseRequest;

class StoreBankAccountRequest extends BaseRequest
{

    public function rules(): array
    {
        return [
            'club_id' => ['required', 'integer', 'exists:clubs,id'],
            
            'bank_name' => ['required', 'string', 'max:255'],

            'account_number' => [
                'required',
                'string',
                'max:30',
            ],

            'account_name' => [
                'required',
                'string',
                'max:255',
            ],

            'qr_image' => [
                'required',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'sort_order' => [
                'nullable',
                'integer',
                'min:0',
            ],

            'is_active' => [
                'nullable',
                'boolean',
            ],
        ];
    }

    /**
     * Attribute label theo domain — hiển thị đúng label tiếng Việt/Anh khi validate fail.
     */
    public function attributes(): array
    {
        return [
            'bank_name'       => __('domains/bank_account.attributes.bank_name'),
            'account_name' => __('domains/bank_account.attributes.account_name'),
            'account_number' => __('domains/bank_account.attributes.account_number'),
        ];
    }
}

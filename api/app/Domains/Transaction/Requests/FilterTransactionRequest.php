<?php

namespace App\Domains\Transaction\Requests;

use App\Base\BaseRequest;

class FilterTransactionRequest extends BaseRequest
{
    /**
     * Filter + Sort
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:255'],

            'club_id' => ['nullable', 'integer', 'min:1'],
            'bank_account_id' => ['nullable', 'integer', 'min:1'],

            'type' => ['nullable', 'in:income,expense'],

            'is_active' => ['nullable', 'boolean'],

            'from_date' => ['nullable', 'date'],
            'to_date' => ['nullable', 'date', 'after_or_equal:from_date'],

            'limit' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],

            'sort_by' => [
                'nullable',
                'string',
                'in:id,transaction_date,amount,balance,type,sort_order,created_at'
            ],

            'sort_dir' => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'club_id' => __('domains/transaction.attributes.club_id'),
            'bank_account_id' => __('domains/transaction.attributes.bank_account_id'),
            'type' => __('domains/transaction.attributes.type'),
            'amount' => __('domains/transaction.attributes.amount'),
            'balance' => __('domains/transaction.attributes.balance'),
            'description' => __('domains/transaction.attributes.description'),
            'reference_code' => __('domains/transaction.attributes.reference_code'),
            'sender_name' => __('domains/transaction.attributes.sender_name'),
            'sender_account' => __('domains/transaction.attributes.sender_account'),
            'transaction_date' => __('domains/transaction.attributes.transaction_date'),
            'is_active' => __('domains/transaction.attributes.is_active'),
        ];
    }
}

<?php

namespace App\Domains\Transaction\Requests;

use App\Base\BaseRequest;

/**
 * Tạo Transaction income thủ công (thu giao lưu, đối soát tay).
 *
 * Expense KHÔNG tạo manual — chỉ qua webhook.
 * Type bị ép = income trong service bất kể input.
 */
class StoreTransactionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'bank_account_id' => ['nullable', 'integer', 'exists:bank_accounts,id'],

            'type'=> 'required|in:income,expense',

            'source'        => ['nullable', 'in:manual,cash'],

            'amount'         => ['required', 'numeric', 'min:0'],

            'description'     => ['nullable', 'string', 'max:1000'],
            'reference_code'  => ['nullable', 'string', 'max:255'],
            'sender_name'     => ['nullable', 'string', 'max:255'],
            'sender_account'  => ['nullable', 'string', 'max:255'],

            'transaction_date' => ['nullable', 'date'],
        ];
    }

    public function attributes(): array
    {
        return [
            'bank_account_id' => __('domains/transaction.attributes.bank_account_id'),
            'type' => __('domains/transaction.attributes.type'),
            'source'          => __('domains/transaction.attributes.source'),
            'amount'          => __('domains/transaction.attributes.amount'),
            'description'     => __('domains/transaction.attributes.description'),
            'reference_code'  => __('domains/transaction.attributes.reference_code'),
            'sender_name'     => __('domains/transaction.attributes.sender_name'),
            'sender_account'  => __('domains/transaction.attributes.sender_account'),
            'transaction_date' => __('domains/transaction.attributes.transaction_date'),
        ];
    }
}

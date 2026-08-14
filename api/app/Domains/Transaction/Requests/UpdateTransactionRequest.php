<?php

namespace App\Domains\Transaction\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'bank_account_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('bank_accounts', 'id')->where(
                    fn ($query) => $query->where(
                        'club_id',
                        $this->attributes->get('club_id'),
                    ),
                ),
            ],
            'amount' => ['sometimes', 'numeric', 'min:0'],
            'reference_code' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sender_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'sender_account' => ['sometimes', 'nullable', 'string', 'max:255'],
            'transaction_date' => ['sometimes', 'date'],
        ];
    }

    public function attributes(): array
    {
        return [
            'description' => __('domains/transaction.attributes.description'),
            'bank_account_id' => __('domains/transaction.attributes.bank_account_id'),
            'amount' => __('domains/transaction.attributes.amount'),
            'reference_code' => __('domains/transaction.attributes.reference_code'),
            'sender_name' => __('domains/transaction.attributes.sender_name'),
            'sender_account' => __('domains/transaction.attributes.sender_account'),
            'transaction_date' => __('domains/transaction.attributes.transaction_date'),
        ];
    }
}

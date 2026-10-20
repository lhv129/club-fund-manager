<?php

namespace App\Domains\Transaction\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateTransactionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'bank_account_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('bank_accounts', 'id')->where(
                    fn($query) => $query->where(
                        'club_id',
                        $this->attributes->get('club_id'),
                    ),
                ),
            ],
            'type' => ['sometimes', 'required', 'in:income,expense'],
            'amount' => ['sometimes', 'required', 'numeric', 'min:0'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'transaction_date' => ['sometimes', 'nullable', 'date'],
        ];
    }

    public function attributes(): array
    {
        return [
            'bank_account_id' => __('domains/transaction.attributes.bank_account_id'),
            'type' => __('domains/transaction.attributes.type'),
            'amount' => __('domains/transaction.attributes.amount'),
            'description' => __('domains/transaction.attributes.description'),
            'transaction_date' => __('domains/transaction.attributes.transaction_date'),
        ];
    }
}

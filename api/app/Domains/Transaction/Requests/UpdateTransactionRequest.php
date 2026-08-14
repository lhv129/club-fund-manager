<?php

namespace App\Domains\Transaction\Requests;

use App\Base\BaseRequest;

class UpdateTransactionRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }

    public function attributes(): array
    {
        return [
            'description' => __('domains/transaction.attributes.description'),
        ];
    }
}

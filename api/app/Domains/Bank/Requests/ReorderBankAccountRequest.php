<?php

namespace App\Domains\Bank\Requests;

use App\Base\BaseRequest;

/**
 * Validate payload reorder (drag-drop sort_order).
 *
 * Body: [{ id: 1, sort_order: 2 }, { id: 2, sort_order: 1 }]
 */
class ReorderBankAccountRequest extends BaseRequest
{

    public function rules(): array
    {
        return [
            '*.id'         => ['required', 'integer', 'min:1'],
            '*.sort_order' => ['required', 'integer', 'min:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'sort_order' => __('domains/bank_account.attributes.sort_order'),
        ];
    }
}

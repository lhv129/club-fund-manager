<?php

namespace App\Domains\Bank\Requests;

use App\Base\BaseRequest;

class FilterBankAccountRequest extends BaseRequest
{
    /**
     * Whitelist sort_by chống cột lạ xuống Query Builder (mục 13 api-overview.md).
     */
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:sort_order,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

}

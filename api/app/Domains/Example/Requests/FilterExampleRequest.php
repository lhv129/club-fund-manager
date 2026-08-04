<?php

namespace App\Domains\Example\Requests;

use App\Base\BaseRequest;

class FilterExampleRequest extends BaseRequest
{
    /**
     * Whitelist sort_by chống cột lạ xuống Query Builder (mục 13 api-overview.md).
     */
    public function rules(): array
    {
        return [
            'search'    => ['nullable', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'user_id'   => ['nullable', 'integer', 'min:1'],
            'limit'     => ['nullable', 'integer', 'min:1', 'max:100'],
            'page'      => ['nullable', 'integer', 'min:1'],
            'sort_by'   => ['nullable', 'string', 'in:id,title,sort_order,created_at'],
            'sort_dir'  => ['nullable', 'string', 'in:asc,desc'],
        ];
    }

    public function attributes(): array
    {
        return [
            'title'       => __('domains/example.attributes.title'),
            'description' => __('domains/example.attributes.description'),
            'is_active'   => __('domains/example.attributes.is_active'),
            'user_id'     => 'user',
        ];
    }
}

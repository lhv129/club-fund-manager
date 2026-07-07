<?php

namespace App\Domains\Example\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateExampleRequest extends BaseRequest
{
    public function rules(): array
    {
        // Lấy {id} từ route để ignore chính record đang update khi check unique
        $id = $this->route('id');

        return [
            'title'       => ['sometimes', 'string', 'max:255'],
            'slug'        => ['sometimes', 'string', 'max:255', Rule::unique('examples', 'slug')->ignore($id)],
            'description' => ['sometimes', 'nullable', 'string'],
            'is_active'   => ['sometimes', 'boolean'],
            'sort_order'  => ['sometimes', 'integer', 'min:0'],
        ];
    }
}

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
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'slug' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('examples', 'slug')->ignore($id)],
            'description' => ['sometimes', 'nullable', 'string'],
            'image' => ['sometimes', 'nullable', 'image', 'max:5120'],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    public function attributes(): array
    {
        return [
            'title' => __('domains/example.attributes.title'),
            'slug' => __('domains/example.attributes.slug'),
            'description' => __('domains/example.attributes.description'),
            'image' => __('domains/example.attributes.image'),
            'is_active' => __('domains/example.attributes.is_active'),
            'sort_order' => __('domains/example.attributes.sort_order'),
        ];
    }
}

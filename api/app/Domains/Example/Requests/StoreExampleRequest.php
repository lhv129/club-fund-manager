<?php

namespace App\Domains\Example\Requests;

use App\Base\BaseRequest;

class StoreExampleRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', 'unique:examples,slug'],
            'description' => ['nullable', 'string'],
            'image' => ['nullable', 'image', 'max:5120'],
            'is_active' => ['nullable', 'boolean'],
            'sort_order' => ['nullable', 'integer', 'min:0'],

            // user_id lấy từ JWTAuth::user()->id trong Controller, không validate ở đây.
        ];
    }

    /**
     * Attribute label theo domain — hiển thị đúng label tiếng Việt/Anh khi validate fail.
     */
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

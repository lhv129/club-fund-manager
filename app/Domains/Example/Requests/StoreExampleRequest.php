<?php

namespace App\Domains\Example\Requests;

use App\Base\BaseRequest;

class StoreExampleRequest extends BaseRequest
{
    // authorize() đã có sẵn trong BaseRequest (return true)
    // Nếu cần check quyền → override authorize() ở đây

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'max:255'],
            'slug'        => ['nullable', 'string', 'max:255', 'unique:examples,slug'],
            'description' => ['nullable', 'string'],
            'is_active'   => ['nullable', 'boolean'],
            'sort_order'  => ['nullable', 'integer', 'min:0'],

            // user_id thường lấy từ Auth::id() trong controller, không cần validate
            // Nhưng nếu admin tạo cho user khác thì cần:
            // 'user_id' => ['required', 'integer', 'exists:users,id'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Tiêu đề không được để trống',
            'slug.unique'    => 'Slug đã tồn tại, vui lòng chọn slug khác',
        ];
    }
}

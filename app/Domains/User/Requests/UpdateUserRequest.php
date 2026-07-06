<?php

namespace App\Domains\User\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'name'     => ['sometimes', 'string', 'max:255'],
            'email'    => ['sometimes', 'email', Rule::unique('users')->ignore($this->route('id'))],
            'password' => ['sometimes', 'string', 'min:8'],
        ];
    }

    public function messages(): array
    {
        return [
            'email.unique'  => 'Email đã tồn tại',
            'password.min'  => 'Mật khẩu tối thiểu 8 ký tự',
        ];
    }
}

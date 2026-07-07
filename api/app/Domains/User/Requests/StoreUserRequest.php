<?php

namespace App\Domains\User\Requests;

use App\Base\BaseRequest;

class StoreUserRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'     => 'Tên không được để trống',
            'email.required'    => 'Email không được để trống',
            'email.unique'      => 'Email đã tồn tại',
            'password.required' => 'Mật khẩu không được để trống',
            'password.min'      => 'Mật khẩu tối thiểu 8 ký tự',
        ];
    }
}

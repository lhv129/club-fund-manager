<?php

namespace App\Domains\Auth\Requests;

use App\Base\BaseRequest;

class RegisterRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => 'required|string|max:255',

            'last_name' => 'required|string|max:255',

            'username' => 'nullable|string|max:255|unique:users,username',

            'gender' => 'nullable|in:male,female,other',

            'email' => 'required|email|unique:users,email',

            'password' => 'required|min:6',

            'confirm_password' => 'required|same:password',

            'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            'bgImage' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',

            'count' => 'nullable|integer|min:0',

            'description' => 'nullable|string|max:2000'
        ];
    }
}

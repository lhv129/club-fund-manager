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

            // 'username' => 'nullable|string|max:255|unique:users,username',

            'gender' => 'nullable|in:male,female,other',

            'email' => 'required|email|unique:users,email',

            'password' => 'required|string|min:8|confirmed',

            // 'phone' => [
            //     'nullable',
            //     'regex:/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/',
            //     'unique:users,phone',
            // ],

            // 'date_of_birth' => [
            //     'nullable',
            //     'date',
            //     'date_format:Y-m-d',
            //     'before_or_equal:today',
            //     'after:1900-01-01',
            // ],

            // 'avatar' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',

            // 'address' => 'nullable|string|max:150'
        ];
    }
}

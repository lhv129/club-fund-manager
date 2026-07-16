<?php

namespace App\Domains\User\Requests;

use App\Base\BaseRequest;

class StoreUserRequest extends BaseRequest
{
    public function rules(): array
    {
        return [
            'first_name' => [
                'required',
                'string',
                'min:2',
                'max:100',
            ],

            'last_name' => [
                'required',
                'string',
                'min:2',
                'max:100',
            ],

            'address' => [
                'nullable',
                'string',
                'max:255',
            ],

            'phone' => [
                'nullable',
                'regex:/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/',
                'unique:users,phone',
            ],

            'date_of_birth' => [
                'nullable',
                'date',
                'date_format:Y-m-d',
                'before_or_equal:today',
                'after:1900-01-01',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'string',
                'min:8',
                'max:255',
            ],

            'gender' => 'nullable|in:male,female,other',

            'avatar' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],

            'status' => 'required|in:active,inactive,locked'
        ];
    }
}

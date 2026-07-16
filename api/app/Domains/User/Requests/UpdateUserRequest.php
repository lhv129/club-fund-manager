<?php

namespace App\Domains\User\Requests;

use App\Base\BaseRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends BaseRequest
{
    public function rules(): array
    {
        $userId = $this->route('id');

        return [

            'first_name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:100',
            ],

            'last_name' => [
                'sometimes',
                'required',
                'string',
                'min:2',
                'max:100',
            ],

            'address' => [
                'sometimes',
                'nullable',
                'string',
                'max:255',
            ],

            'phone' => [
                'sometimes',
                'nullable',
                'regex:/^(?:\+84|0)(?:3|5|7|8|9)\d{8}$/',
                Rule::unique('users', 'phone')->ignore($userId),
            ],

            'date_of_birth' => [
                'sometimes',
                'nullable',
                'date',
                'date_format:Y-m-d',
                'before_or_equal:today',
                'after:1900-01-01',
            ],

            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($userId),
            ],

            'password' => [
                'sometimes',
                'required',
                'string',
                'min:8',
                'max:255',
            ],

            'gender' => [
                'sometimes',
                'nullable',
                Rule::in(['male', 'female', 'other']),
            ],

            'avatar' => [
                'sometimes',
                'nullable',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],

            'status' => [
                'sometimes',
                'required',
                'in:active,inactive,locked',
            ],
        ];
    }
}

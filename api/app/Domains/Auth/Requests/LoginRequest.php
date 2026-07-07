<?php

namespace App\Domains\Auth\Requests;

use App\Base\BaseRequest;

class LoginRequest extends BaseRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login'    => 'required|string',
            'password' => 'required',
        ];
    }
}

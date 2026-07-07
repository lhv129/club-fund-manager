<?php

namespace App\Domains\Auth\Controllers;

use App\Base\BaseController;
use App\Domains\Auth\Requests\LoginRequest;
use App\Domains\Auth\Services\LoginService;

class LoginController extends BaseController
{
    protected object $service;

    public function __construct(LoginService $service)
    {
        $this->service = $service;
    }

    public function login(LoginRequest $request)
    {
        $result = $this->service->login($request->validated());

        return $this->responseCommon(
            true,
            __('domains/auth.login_success'),
            $result,
            200
        );
    }
}

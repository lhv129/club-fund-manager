<?php

namespace App\Domains\Auth\Controllers;

use App\Base\BaseController;
use App\Domains\Auth\Services\AuthService;
use Illuminate\Http\Request;

class AuthController extends BaseController
{

    protected object $service;

    public function __construct(AuthService $service)
    {
        $this->service = $service;
    }

    public function profile()
    {
        $profile = $this->service->profile();

        return $this->responseCommon(true, __('domains/auth.get_profile'), $profile, 200);
    }

    public function refresh(Request $request)
    {
        $data = $this->service->refresh($request->input('refresh_token'));

        return $this->responseCommon(true, __('domains/auth.refresh_token'), $data, 200);
    }
}

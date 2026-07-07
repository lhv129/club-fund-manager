<?php

namespace App\Domains\Auth\Controllers;

use App\Base\BaseController;
use App\Domains\Auth\Requests\RegisterRequest;
use App\Domains\Auth\Services\RegisterService;

class RegisterController extends BaseController
{
    protected object $service;

    public function __construct(RegisterService $service)
    {
        $this->service = $service;
    }

    public function register(RegisterRequest $request)
    {
        $result = $this->service->register($request->validated(), $request->file('avatar'), $request->file('bgImage'));

        return $this->responseCommon(true, $result['message'], [], 200);
    }
}

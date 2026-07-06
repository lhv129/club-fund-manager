<?php

namespace App\Domains\Auth\Services;

use App\Base\BaseService;
use App\Domains\Auth\Resources\ProfileResource;
use App\Domains\User\Repositories\UserRepository;
use App\Domains\User\Services\UserRefreshTokenService;
use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Hash;
use Tymon\JWTAuth\Facades\JWTAuth;

class LoginService extends BaseService
{
    protected object $userRefreshTokenService;
    protected object $userRepository;

    public function __construct(
        UserRepository $userRepository,
        UserRefreshTokenService $userRefreshTokenService
    ) {
        $this->userRefreshTokenService = $userRefreshTokenService;
        $this->userRepository = $userRepository;
    }

    public function login(array $data)
    {
        $user = $this->userRepository->findByEmailOrUsername($data['login']);

        if (!$user) {
            throw new ApiException(
                __('domains/auth.user_not_found'),
                404
            );
        }

        if (!Hash::check($data['password'], $user->password)) {
            throw new ApiException(
                __('domains/auth.wrong_password'),
                401
            );
        }

        if ($user->isPendingVerification()) {
            throw new ApiException(
                __('domains/auth.account_not_verified'),
                403
            );
        }

        if ($user->isLocked()) {
            throw new ApiException(
                __('domains/auth.account_locked'),
                403
            );
        }

        $token = JWTAuth::fromUser($user);
        $refreshToken = $this->userRefreshTokenService->handle($user->id);

        return [
            'access_token'  => $token,
            'refresh_token' => $refreshToken,
            'user'          => new ProfileResource($user),
            'token_type'    => 'bearer',
            'expires_in'    => JWTAuth::factory()->getTTL() * 60,
        ];
    }
}

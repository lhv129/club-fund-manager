<?php

namespace App\Domains\Auth\Services;

use App\Base\BaseService;
use App\Domains\Auth\Resources\ProfileResource;
use App\Domains\User\Repositories\UserRefreshTokenRepository;
use App\Domains\User\Services\UserService;
use App\Exceptions\ApiException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Tymon\JWTAuth\Facades\JWTAuth;


class AuthService extends BaseService
{

    protected object $userService;
    protected object $userRefreshTokenRepository;

    public function __construct(
        UserService $userService,
        UserRefreshTokenRepository $userRefreshTokenRepository
    ) {
        $this->userService = $userService;
        $this->userRefreshTokenRepository = $userRefreshTokenRepository;
    }

    public function profile()
    {
        return new ProfileResource(Auth::user());
    }

    public function refresh(string $refreshToken)
    {
        $token = $this->userRefreshTokenRepository->findByToken($refreshToken);

        if (!$token) {
            throw new ApiException(__('domains/auth.refresh_token_invalid'), 401);
        }

        if ($token->expires_at->isPast()) {
            $token->delete();
            throw new ApiException(__('domains/auth.refresh_token_expired'), 401);
        }

        $user = $token->user;

        // check user tồn tại
        if (!$user) {
            $token->delete();
            throw new ApiException(__('domains/user.user_not_found'), 404);
        }

        // tạo access token mới
        $accessToken = JWTAuth::fromUser($user);

        // rotate refresh token (tạo token mới)
        $newRefreshToken = Str::random(64);

        $token->update([
            'token' => $newRefreshToken,
            'expires_at' => now()->addDays(7)
        ]);

        return [
            'access_token' => $accessToken,
            'refresh_token' => $newRefreshToken,
            'token_type' => 'bearer',
            'expires_in' => JWTAuth::factory()->getTTL() * 60,
        ];
    }
}

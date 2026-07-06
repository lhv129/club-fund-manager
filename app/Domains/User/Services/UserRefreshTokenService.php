<?php

namespace App\Domains\User\Services;


use App\Base\BaseService;
use App\Domains\User\Repositories\UserRefreshTokenRepository;
use Illuminate\Support\Str;

/**
 * @extends BaseService<\App\Domains\User\Repositories\UserRefreshTokenRepository>
 */
class UserRefreshTokenService extends BaseService
{
    public function __construct(UserRefreshTokenRepository $repository)
    {
        parent::__construct($repository);
    }

    public function handle($userId)
    {
        $refresh = $this->repository->findByUserId($userId);

        if (!$refresh) {

            $token = Str::random(64);

            $this->repository->create([
                'user_id' => $userId,
                'token' => $token,
                'expires_at' => now()->addDays(7)
            ]);

            return $token;
        }

        if ($refresh->expires_at->isPast()) {

            $token = Str::random(64);

            $this->repository->update($refresh, [
                'token' => $token,
                'expires_at' => now()->addDays(7)
            ]);

            return $token;
        }

        return $refresh->token;
    }
}

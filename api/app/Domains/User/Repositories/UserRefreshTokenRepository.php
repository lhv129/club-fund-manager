<?php

namespace App\Domains\User\Repositories;

use App\Base\BaseRepository;
use App\Domains\User\Models\UserRefreshToken;

class UserRefreshTokenRepository extends BaseRepository
{
    public function __construct(UserRefreshToken $model)
    {
        parent::__construct($model);
    }

    public function findByUserId($userId)
    {
        return $this->model->where('user_id', $userId)->first();
    }

    public function findByToken(string $token)
    {
        return $this->model->where('token', $token)->first();
    }
    
}

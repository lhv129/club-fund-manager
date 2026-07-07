<?php

namespace App\Domains\User\Repositories;

use App\Base\BaseRepository;
use App\Domains\User\Models\User;

class UserRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'id';
    protected string $defaultOrderDirection = 'desc';

    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    public function findByEmail(string $email): ?User
    {
        return $this->model->where('email', $email)->first();
    }

    public function findByEmailOrUsername(string $login): ?User
    {
        return $this->model
            ->where('email', $login)
            ->orWhere('username', $login)
            ->first();
    }
}

<?php

namespace App\Domains\Club\Services;

use App\Base\BaseService;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\User\Models\User;

class ClubService extends BaseService
{
    protected object $repository;

    public function __construct(
        ClubRepository $repository
    ) {
        parent::__construct($repository);
    }

    /**
     * Superadmin -> tất cả clubs
     * Manager/Member -> chỉ clubs mình đã được approved
     */
    public function index(User $user, array $filters): mixed
    {
        if ($user->isSuperAdmin()) {
            return $this->repository->getAll($filters);
        }

        return $this->repository->getByUser($user->id, $filters);
    }
}

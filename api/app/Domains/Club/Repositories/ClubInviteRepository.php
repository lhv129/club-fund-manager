<?php

namespace App\Domains\Club\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\ClubInvite;

class ClubInviteRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(ClubInvite $model)
    {
        parent::__construct($model);
    }

    /**
     * Tìm invite hợp lệ theo token.
     *
     * Hợp lệ khi:
     *   - is_active = true
     *   - expires_at IS NULL  hoặc  expires_at > now()
     */
    public function findValidByToken(string $token): ?ClubInvite
    {
        return $this->model
            ->where('token', $token)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->with(['club.translations'])
            ->first();
    }
}

<?php

namespace App\Domains\Club\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\Club;

class ClubRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Club $model)
    {
        parent::__construct($model);
    }

    /**
     * Superadmin: toàn bộ danh sách clubs (phân trang)
     */
    public function getAll(array $filters = [])
    {
        $query = $this->model
            ->select(['id', 'slug', 'logo', 'is_active', 'sort_order', 'created_at'])
            ->with(['translations'])
            ->withCount(['members as total_members' => function ($q) {
                $q->where('status', 'approved')->where('is_active', 1);
            }]);

        if (!empty($filters['search'])) {
            $query->whereHas('translations', function ($q) use ($filters) {
                $q->where('name', 'LIKE', '%' . $filters['search'] . '%');
            });
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $query->where('is_active', $filters['is_active']);
        }

        $query->orderBy('sort_order')->orderByDesc('id');

        $limit = $filters['limit'] ?? $this->defaultLimit;

        return $query->paginate($limit);
    }

    /**
     * Manager/Member: clubs mình được approved (phân trang)
     */
    public function getByUser(int $userId, array $filters = [])
    {
        $query = $this->model
            ->select(['clubs.id', 'clubs.slug', 'clubs.logo', 'clubs.is_active', 'clubs.sort_order', 'clubs.created_at'])
            ->join('club_members', 'club_members.club_id', '=', 'clubs.id')
            ->where('club_members.user_id', $userId)
            ->where('club_members.status', 'approved')
            ->where('club_members.is_active', 1)
            ->where('clubs.is_active', 1)
            ->with(['translations'])
            ->withCount(['members as total_members' => function ($q) {
                $q->where('status', 'approved')->where('is_active', 1);
            }]);

        if (!empty($filters['search'])) {
            $query->whereHas('translations', function ($q) use ($filters) {
                $q->where('name', 'LIKE', '%' . $filters['search'] . '%');
            });
        }

        $query->orderBy('clubs.sort_order')->orderByDesc('clubs.id');

        $limit = $filters['limit'] ?? $this->defaultLimit;

        return $query->paginate($limit);
    }
}

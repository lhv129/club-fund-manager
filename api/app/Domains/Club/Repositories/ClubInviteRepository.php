<?php

namespace App\Domains\Club\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\ClubInvite;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ClubInviteRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    protected array $allowedSortColumns = [
        'id',
        'sort_order',
        'created_at',
        'expires_at',
    ];

    public function __construct(ClubInvite $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Hook overrides
    // ------------------------------------------------------------------

    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $query->where('token', 'like', "%{$filters['search']}%");
        }
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
    }

    /**
     * Query cơ sở cho danh sách invite.
     */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'club_invites.id',
                'club_invites.club_id',
                'club_invites.created_by',
                'club_invites.token',
                'club_invites.expires_at',
                'club_invites.used_count',
                'club_invites.sort_order',
                'club_invites.is_active',
                'club_invites.created_at',
            ])
            ->with([
                'createdBy',
                'club.translations:id,club_id,locale,name,slug',
            ]);
    }

    // ------------------------------------------------------------------
    // Domain-specific list methods
    // ------------------------------------------------------------------

    /**
     * Danh sách invite theo club slug.
     */
    public function paginateByClub(
        string $clubSlug,
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->baseListQuery()
            ->whereHas('club.translations', function ($q) use ($clubSlug) {
                $q->where('slug', $clubSlug);
            });

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        $this->applySorting(
            $query,
            $filters,
            $this->allowedSortColumns
        );

        return $query->paginate(
            $filters['limit'] ?? $this->defaultLimit,
            ['*'],
            'page',
            $filters['page'] ?? 1
        );
    }

    /**
     * Tìm một invite theo club slug + invite id.
     */
    public function findByClubSlug(
        string $clubSlug,
        int $id
    ): ?ClubInvite {
        return $this->model
            ->with([
                'createdBy',
                'club.translations:id,club_id,locale,name,slug',
            ])
            ->whereKey($id)
            ->whereHas('club.translations', function ($q) use ($clubSlug) {
                $q->where('slug', $clubSlug);
            })
            ->first();
    }

    // ------------------------------------------------------------------
    // Ad-hoc lookups
    // ------------------------------------------------------------------

    /**
     * Tìm invite hợp lệ theo token.
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
            ->with([
                'createdBy',
                'club.translations',
            ])
            ->first();
    }
}

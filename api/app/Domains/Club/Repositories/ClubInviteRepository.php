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

    public function __construct(ClubInvite $model)
    {
        parent::__construct($model);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * Danh sách invite của 1 club (offset pagination).
     * Toàn bộ filter/search/sort nằm ở đây — Service chỉ truyền $filters + clubId.
     */
    public function paginateClubInvites(int $clubId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model
            ->select(['id', 'club_id', 'created_by', 'token', 'expires_at', 'used_count', 'sort_order', 'is_active', 'created_at'])
            ->with(['creator'])
            ->where('club_id', $clubId);

        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters, ['id', 'sort_order', 'created_at', 'expires_at']);

        return $query->paginate($filters['limit'] ?? $this->defaultLimit);
    }

    // ------------------------------------------------------------------
    // Domain-specific filter builders
    // ------------------------------------------------------------------

    /** Không có search theo text — invite không có trường searchable. */
    protected function applySearch(Builder $query, array $filters): void
    {
        // no-op — mở rộng nếu cần search theo token/creator.
    }

    /** Filter theo is_active. */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
    }

    // -------------------------------------------------------------------------
    // Ad-hoc lookups
    // -------------------------------------------------------------------------

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

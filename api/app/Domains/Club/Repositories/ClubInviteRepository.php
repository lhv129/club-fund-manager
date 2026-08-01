<?php

namespace App\Domains\Club\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\ClubInvite;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ClubInviteRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'sort_order';
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
            $query->where('invite_code', 'like', "%{$filters['search']}%");
        }
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
    }

    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'club_invites.id',
                'club_invites.club_id',
                'club_invites.created_by',
                'club_invites.invite_code',
                'club_invites.expires_at',
                'club_invites.used_count',
                'club_invites.is_active',
                'club_invites.created_at',
            ])
            ->with([
                'createdBy:id,fullname,email,phone,avatar',
                'club.translation:id,club_id,locale,name,slug',
            ]);
    }

    // ------------------------------------------------------------------
    // Domain-specific list methods
    // ------------------------------------------------------------------

    /**
     * Danh sách invite theo club.
     * Service inject 'club_slug' vào $filters trước khi gọi.
     *
     * Dùng method riêng thay vì kế thừa getList() vì cần inject
     * whereHas theo context param (club_slug) từ Service.
     */
    public function getList(array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseListQuery();

        if (!empty($filters['club_slug'])) {
            $query->whereHas(
                'club.translations',
                fn($q) =>
                $q->where('slug', $filters['club_slug'])
            );
        }

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters, $this->allowedSortColumns);

        return $query->paginate(
            $filters['limit'] ?? $this->defaultLimit,
            ['*'],
            'page',
            $filters['page'] ?? 1
        );
    }

    // ------------------------------------------------------------------
    // Ad-hoc lookups
    // ------------------------------------------------------------------

    /**
     * Tìm một invite theo club slug + invite id.
     */
    public function findByClubSlug(string $clubSlug, int $id): ?ClubInvite
    {
        return $this->model
            ->with([
                'createdBy',
                'club.translation:id,club_id,locale,name,slug',
            ])
            ->whereKey($id)
            ->whereHas(
                'club.translation',
                fn($q) =>
                $q->where('slug', $clubSlug)
            )
            ->first();
    }

    /**
     * Tìm invite đang còn hiệu lực của user trong một club.
     * Dùng để kiểm tra trước khi tạo mới — tránh spam bản ghi.
     *
     * Điều kiện "còn hiệu lực":
     *   - is_active = true
     *   - expires_at IS NULL hoặc expires_at > now()
     */
    public function findActiveByUserAndClub(int $userId, int $clubId): ?ClubInvite
    {
        return $this->model
            ->with([
                'createdBy',
                'club.translation:id,club_id,locale,name,slug',
            ])
            ->where('created_by', $userId)
            ->where('club_id', $clubId)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->first();
    }

    /**
     * Tìm invite hợp lệ theo token (dùng khi user dùng link tham gia).
     */
    public function findValidByToken(string $inviteCode): ?ClubInvite
    {
        return $this->model
            ->where('invite_code', $inviteCode)
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->with([
                'createdBy',
                'club.translation',
            ])
            ->first();
    }
}

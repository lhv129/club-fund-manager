<?php

namespace App\Domains\Club\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\ClubMember;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class ClubMemberRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'created_at';
    protected string $defaultOrderDirection = 'desc';

    public function __construct(ClubMember $model)
    {
        parent::__construct($model);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * Danh sách member của 1 club (offset pagination).
     * Toàn bộ filter/search/sort nằm ở đây — Service chỉ truyền $filters + clubId.
     */
    public function paginateClubMembers(int $clubId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->model
            ->select(['id', 'club_id', 'user_id', 'join_type', 'status', 'is_active', 'joined_at', 'created_at'])
            ->with(['user'])
            ->where('club_id', $clubId);

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters, ['id', 'joined_at', 'created_at']);

        return $query->paginate($filters['limit'] ?? $this->defaultLimit);
    }

    // ------------------------------------------------------------------
    // Domain-specific filter builders
    // ------------------------------------------------------------------

    /** Search theo fullname / email của user qua relationship. */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->whereHas('user', function ($q) use ($search) {
                $q->where('fullname', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }
    }

    /** Filter theo status (string), join_type, is_active. */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyStatusFilter($query, $filters, 'status', ['pending', 'approved', 'rejected']);

        if (isset($filters['join_type']) && $filters['join_type'] !== '' && $filters['join_type'] !== null) {
            $query->where('join_type', $filters['join_type']);
        }
        $this->applyActiveFilter($query, $filters);
    }

    // -------------------------------------------------------------------------
    // Role assignment
    // -------------------------------------------------------------------------

    /**
     * Gán role mặc định cho member trong club.
     *
     * Dùng insertOrIgnore để tránh duplicate nếu gọi lại nhiều lần.
     * club_member_roles có unique(club_id, user_id, role_id).
     */
    public function assignRole(ClubMember $member, int $roleId): void
    {
        DB::table('club_member_roles')->insertOrIgnore([
            'club_id'    => $member->club_id,
            'user_id'    => $member->user_id,
            'role_id'    => $roleId,
            'is_active'  => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Xoá tất cả role của member trong club (khi remove member).
     */
    public function removeAllRoles(ClubMember $member): void
    {
        DB::table('club_member_roles')
            ->where('club_id', $member->club_id)
            ->where('user_id', $member->user_id)
            ->delete();
    }

    // -------------------------------------------------------------------------
    // Permission check helper
    // -------------------------------------------------------------------------

    /**
     * Kiểm tra member có quyền cụ thể trong club không.
     *
     * Tra qua: club_member_roles → role_permissions → permissions
     *
     * @param int    $clubId
     * @param int    $userId
     * @param string $moduleSlug  vd: 'club'
     * @param string $action      vd: 'view' | 'create' | 'update' | 'delete'
     */
    public function hasPermission(int $clubId, int $userId, string $moduleSlug, string $action): bool
    {
        return DB::table('club_member_roles as cmr')
            ->join('role_permissions as rp', function ($join) {
                $join->on('rp.role_id', '=', 'cmr.role_id')
                    ->whereNull('rp.deleted_at')
                    ->where('rp.is_active', true);
            })
            ->join('permissions as p', function ($join) use ($action) {
                $join->on('p.id', '=', 'rp.permission_id')
                    ->where('p.action', $action)
                    ->where('p.is_active', true)
                    ->whereNull('p.deleted_at');
            })
            ->join('modules as m', function ($join) use ($moduleSlug) {
                $join->on('m.id', '=', 'p.module_id')
                    ->where('m.slug', $moduleSlug)
                    ->where('m.is_active', true);
            })
            ->where('cmr.club_id', $clubId)
            ->where('cmr.user_id', $userId)
            ->where('cmr.is_active', true)
            ->whereNull('cmr.deleted_at')
            ->exists();
    }
}

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

    protected array $allowedSortColumns = [
        'id',
        'joined_at',
        'created_at',
    ];

    /**
     * Cột cho getForSelect().
     */
    protected array $selectColumns = [
        'id',
        'user_id',
    ];

    protected array $selectWith = [
        'user:id,fullname,email,phone',
    ];

    public function __construct(ClubMember $model)
    {
        parent::__construct($model);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * Query cơ sở dùng chung cho list.
     */
    protected function baseListQuery(?int $clubId = null): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'user_id',

                'invited_by',

                'reviewed_by',
                'reviewed_at',

                'removed_by',
                'removed_at',

                'banned_by',
                'banned_at',
                'banned_reason',

                'join_type',
                'joined_at',

                'is_active',
                'status',

                'rejected_reason',

                'created_at',
                'updated_at',
            ])
            ->with([
                'user:id,fullname,email,phone,status,gender,avatar,updated_at,created_at',

                'user.clubMemberRoles' => function ($q) use ($clubId) {
                    $q->select([
                        'id',
                        'club_id',
                        'user_id',
                        'role_id',
                    ])
                        ->when(
                            $clubId,
                            fn($query) => $query->where(
                                'club_id',
                                $clubId
                            )
                        )
                        ->with([
                            'role' => function ($q) {
                                $q->select([
                                    'id',
                                    'slug',
                                    'scope',
                                    'sort_order',
                                    'is_active',
                                    'created_at',
                                    'updated_at',
                                ])
                                    ->with([
                                        'translation' => function ($q) {
                                            $q->select([
                                                'role_id',
                                                'locale',
                                                'name',
                                            ]);
                                        },
                                    ]);
                            },
                        ]);
                },

                'reviewedBy:id,fullname',
                'invitedBy:id,fullname',
                'removedBy:id,fullname',
                'bannedBy:id,fullname',
            ]);
    }

    /**
     * Danh sách member.
     */
    public function getList(array $filters = []): LengthAwarePaginator
    {
        $clubId = ! empty($filters['club_id'])
            ? (int) $filters['club_id']
            : null;

        $query = $this->baseListQuery($clubId);

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
            $filters['page'] ?? $this->defaultPage
        );
    }

    // -------------------------------------------------------------------------
    // Search
    // -------------------------------------------------------------------------

    /**
     * Search theo fullname / email.
     */
    protected function applySearch(
        Builder $query,
        array $filters
    ): void {
        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->whereHas('user', function ($q) use ($search) {
                $q->where(
                    'fullname',
                    'like',
                    "%{$search}%"
                )
                    ->orWhere(
                        'email',
                        'like',
                        "%{$search}%"
                    );
            });
        }
    }

    // -------------------------------------------------------------------------
    // Filters
    // -------------------------------------------------------------------------

    /**
     * Filter:
     *
     * - club_id
     * - status
     * - join_type
     * - is_active
     */
    protected function applyFilters(
        Builder $query,
        array $filters
    ): void {
        if (! empty($filters['club_id'])) {
            $query->where(
                'club_id',
                (int) $filters['club_id']
            );
        }

        $this->applyStatusFilter(
            $query,
            $filters,
            'status',
            [
                'pending',
                'approved',
                'rejected',
                'removed',
                'banned',
            ]
        );

        if (
            isset($filters['join_type'])
            && $filters['join_type'] !== ''
            && $filters['join_type'] !== null
        ) {
            $query->where(
                'join_type',
                $filters['join_type']
            );
        }

        $this->applyActiveFilter(
            $query,
            $filters
        );
    }

    // -------------------------------------------------------------------------
    // Find
    // -------------------------------------------------------------------------

    /**
     * Find member theo club + member ID.
     */
    public function findByClubIdAndMemberId(
        int $clubId,
        int $memberId,
        array $with = []
    ): ?ClubMember {
        return $this->model
            ->with($with)
            ->where('club_id', $clubId)
            ->where('id', $memberId)
            ->first();
    }

    /**
     * Find member theo club + user.
     *
     * Dùng cho join để kiểm tra:
     *
     * pending / approved / rejected / removed / banned
     */
    public function findByClubIdAndUserId(
        int $clubId,
        int $userId
    ): ?ClubMember {
        return $this->model
            ->where('club_id', $clubId)
            ->where('user_id', $userId)
            ->first();
    }

    /**
     * Find pending member.
     */
    public function findPendingByClubIdAndMemberId(
        int $clubId,
        int $memberId
    ): ?ClubMember {
        return $this->model
            ->where('club_id', $clubId)
            ->where('id', $memberId)
            ->where('status', 'pending')
            ->first();
    }

    // -------------------------------------------------------------------------
    // Role assignment
    // -------------------------------------------------------------------------

    /**
     * Gán role mặc định cho member.
     */
    public function assignRole(
        ClubMember $member,
        int $roleId
    ): void {
        DB::table('club_member_roles')
            ->insertOrIgnore([
                'club_id'    => $member->club_id,
                'user_id'    => $member->user_id,
                'role_id'    => $roleId,
                'is_active'  => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
    }

    // -------------------------------------------------------------------------
    // Permission
    // -------------------------------------------------------------------------

    /**
     * Kiểm tra member có permission trong club.
     */
    public function hasPermission(
        int $clubId,
        int $userId,
        string $moduleSlug,
        string $action
    ): bool {
        return DB::table('club_member_roles as cmr')
            ->join('role_permissions as rp', function ($join) {
                $join->on(
                    'rp.role_id',
                    '=',
                    'cmr.role_id'
                )
                    ->whereNull('rp.deleted_at')
                    ->where('rp.is_active', true);
            })
            ->join('permissions as p', function ($join) use ($action) {
                $join->on(
                    'p.id',
                    '=',
                    'rp.permission_id'
                )
                    ->where('p.action', $action)
                    ->where('p.is_active', true)
                    ->whereNull('p.deleted_at');
            })
            ->join('modules as m', function ($join) use ($moduleSlug) {
                $join->on(
                    'm.id',
                    '=',
                    'p.module_id'
                )
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

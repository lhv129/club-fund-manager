<?php

namespace App\Domains\Club\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\Club;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ClubRepository extends BaseRepository
{
    // ------------------------------------------------------------------
    // Cấu hình — Base sử dụng trực tiếp
    // ------------------------------------------------------------------

    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    /** Whitelist cột sort cho getList() */
    protected array $allowedSortColumns = ['id', 'sort_order', 'created_at'];

    /** Cột + relation cho getForSelect() */
    protected array $selectColumns = ['id', 'max_members', 'logo'];
    protected array $selectWith    = ['translations'];

    public function __construct(Club $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Hook overrides
    // ------------------------------------------------------------------

    /**
     * Search theo name qua relationship translations.
     */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $query->whereHas('translations', function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters['search']}%");
            });
        }
    }

    /**
     * Filter đặc thù Club: is_active.
     * Thêm filter mới vào đây thay vì rải rác trong các list method.
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
    }

    /**
     * Query cơ sở cho getList() / getCursorList().
     * Thêm select cụ thể, translations, withCount member.
     */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'logo',
                'is_active',
                'sort_order',
                'max_members',
                'created_at',
            ])
            ->with('translations')
            ->withCount([
                'members as total_members' => function ($q) {
                    $q->where('status', 'approved')
                        ->where('is_active', 1);
                },
            ]);
    }

    /**
     * Cursor order: sort_order ASC + id ASC (ổn định, unique).
     */
    protected function applyCursorOrder(Builder $query): void
    {
        $query->orderBy('sort_order', 'asc')
            ->orderBy('id', 'asc');
    }

    // ------------------------------------------------------------------
    // Domain-specific list methods
    // ------------------------------------------------------------------

    /**
     * Manager/Member: chỉ clubs mình được approved (phân trang).
     * Luôn lọc clubs.is_active = 1 — không expose filter is_active cho user thường.
     */
    public function getByUser(int $userId, array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseListQuery()
            ->join('club_members', 'club_members.club_id', '=', 'clubs.id')
            ->where('club_members.user_id', $userId)
            ->where('club_members.status', 'approved')
            ->where('club_members.is_active', 1)
            ->where('clubs.is_active', 1);

        $this->applySearch($query, $filters);

        $query->orderBy('clubs.sort_order', 'asc')
            ->orderByDesc('clubs.id');

        return $query->paginate(
            $filters['limit'] ?? $this->defaultLimit,
            ['*'],
            'page',
            $filters['page'] ?? 1
        );
    }

    // ------------------------------------------------------------------
    // Write helpers
    // ------------------------------------------------------------------

    /**
     * Cập nhật user_id (owner) của club, đồng thời upsert club_member
     * để owner luôn có trạng thái approved & is_active = 1.
     */
    public function updateOwner(Club $club, int $newOwnerId): Club
    {
        $club->user_id = $newOwnerId;
        $club->save();

        $club->members()->updateOrCreate(
            ['user_id' => $newOwnerId],
            [
                'status'    => 'approved',
                'is_active' => 1,
            ]
        );

        return $club->fresh(['translations']);
    }
}

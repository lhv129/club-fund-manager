<?php

namespace App\Domains\Bank\Repositories;

use App\Base\BaseRepository;
use App\Domains\Bank\Models\BankAccount;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class BankAccountRepository extends BaseRepository
{
    // ------------------------------------------------------------------
    // Cấu hình — Base sử dụng trực tiếp
    // ------------------------------------------------------------------

    /** BankAccount mặc định sort theo sort_order asc (kéo thả) */
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    /** Whitelist cột sort cho getList() — chống cột lạ xuống Query Builder */
    protected array $allowedSortColumns = ['id', 'title', 'sort_order', 'created_at'];

    /** Cột cho getForSelect() — dropdown trả [{id, title, slug}] */
    protected array $selectColumns = ['id', 'title', 'slug'];
    protected array $selectWith    = [];

    public function __construct(BankAccount $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Hook overrides
    // ------------------------------------------------------------------

    /**
     * Query cơ sở cho getList() / getCursorList().
     * Select cột cần thiết + eager load user để tránh N+1 khi render list.
     */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'bank_id',
                'account_name',
                'account_number',
                'qr_image',
                'is_active',
                'is_default',
                'sort_order',
                'created_at',
            ])
            ->with([
                'bank:id,code,name,logo',
            ]);
    }

    /**
     * Search theo title hoặc description.
     */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (empty($filters['search'])) {
            return;
        }

        $search = trim($filters['search']);

        $query->where(function (Builder $q) use ($search) {
            $q->where('account_number', 'like', "%{$search}%")
                ->orWhere('account_name', 'like', "%{$search}%")
                ->orWhereHas('bank', function (Builder $bankQuery) use ($search) {
                    $bankQuery
                        ->where('code', 'like', "%{$search}%")
                        ->orWhere('name', 'like', "%{$search}%")
                        ->orWhere('short_name', 'like', "%{$search}%");
                });
        });
    }

    /**
     * Filter đặc thù BankAccount: is_active (boolean) + user_id.
     * Thêm filter mới vào đây — getList / getCursorList / getForSelect tự áp dụng.
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (!empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }
        if (!empty($filters['club_id'])) {
            $query->where('club_id', (int) $filters['club_id']);
        }
    }

    // ------------------------------------------------------------------
    // Domain-specific list methods
    // ------------------------------------------------------------------

    /**
     * Offset pagination (admin table).
     * Build từ baseListQuery() + hooks. Sort whitelist chặn cột lạ.
     */
    public function getList(array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseListQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters, $this->allowedSortColumns);

        return $query->paginate(
            $filters['limit'] ?? $this->defaultLimit,
            ['*'],
            'page',
            $filters['page'] ?? $this->defaultPage
        );
    }

    /**
     * Cursor pagination (infinite scroll).
     * Cursor phải orderBy cột unique → applyCursorOrder() mặc định đã có tie-breaker id desc.
     */
    public function getCursorList(array $filters = []): CursorPaginator
    {
        $query = $this->baseListQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applyCursorOrder($query);

        return $query->cursorPaginate($filters['limit'] ?? $this->defaultLimit);
    }

    /**
     * Dropdown — nhẹ, không phân trang, không Resource.
     * Chỉ trả id + title + slug, defaultOrderBy (sort_order asc).
     */
    public function getForSelect(array $filters = []): Collection
    {
        $query = $this->baseSelectQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        $query->orderBy($this->defaultOrderBy, $this->defaultOrderDirection);

        return $query
            ->limit(min((int) ($filters['limit'] ?? $this->selectDefaultLimit), $this->selectMaxLimit))
            ->get();
    }

    public function clearDefault(int $clubId): void
    {
        $this->model
            ->where('club_id', $clubId)
            ->where('is_default', true)
            ->update([
                'is_default' => false,
            ]);
    }

    /**
     * Lấy bank account active của club.
     *
     * Ưu tiên:
     * 1. is_default = true
     * 2. sort_order asc
     * 3. id asc
     */
    public function findActiveDefaultByClub(int $clubId): ?BankAccount
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'bank_id',
                'account_name',
                'account_number',
                'qr_image',
                'sort_order',
                'is_active',
                'is_default',
            ])
            ->with([
                'bank:id,code,name,short_name,logo',
            ])
            ->where('club_id', $clubId)
            ->where('is_active', true)
            ->orderByDesc('is_default')
            ->orderBy('sort_order')
            ->orderBy('id')
            ->first();
    }
}

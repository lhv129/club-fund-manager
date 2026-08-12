<?php

namespace App\Domains\Example\Repositories;

use App\Base\BaseRepository;
use App\Domains\Example\Models\Example;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ExampleRepository extends BaseRepository
{
    // ------------------------------------------------------------------
    // Cấu hình — Base sử dụng trực tiếp
    // ------------------------------------------------------------------

    /** Example mặc định sort theo sort_order asc (kéo thả) */
    protected string $defaultOrderBy = 'sort_order';

    protected string $defaultOrderDirection = 'asc';

    /** Whitelist cột sort cho getList() — chống cột lạ xuống Query Builder */
    protected array $allowedSortColumns = ['id', 'title', 'sort_order', 'created_at'];

    /** Cột cho getForSelect() — dropdown trả [{id, title, slug}] */
    protected array $selectColumns = ['id', 'title', 'slug'];

    protected array $selectWith = [];

    public function __construct(Example $model)
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
                'user_id',
                'title',
                'slug',
                'description',
                'is_active',
                'sort_order',
                'created_at',
            ])
            ->with(['user:id,fullname']);
    }

    /**
     * Search theo title hoặc description.
     */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }
    }

    /**
     * Filter đặc thù Example: is_active (boolean) + user_id.
     * Thêm filter mới vào đây — getList / getCursorList / getForSelect tự áp dụng.
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (! empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
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

    public function findWithTrashed(int $id): ?Example
    {
        return $this->model->withTrashed()->find($id);
    }

    public function findOnlyTrashed(int $id): ?Example
    {
        return $this->model->onlyTrashed()->find($id);
    }
}

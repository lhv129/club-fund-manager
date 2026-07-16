<?php

namespace App\Base;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use App\Base\Traits\HasTranslationSlug;

/**
 * -------------------------------------------------------------
 *  Base Laravel API
 *  Author : vietlh
 *  Email  : vietlh.hn@gmail.com
 *  Created: 2026
 *  License: Private / MIT
 * -------------------------------------------------------------
 */

abstract class BaseRepository
{
    protected Model $model;

    // ------------------------------------------------------------------
    // Defaults — Repository con override khi cần
    // ------------------------------------------------------------------

    /** Cột sort mặc định */
    protected string $defaultOrderBy        = 'id';
    protected string $defaultOrderDirection = 'desc';

    /** Số bản ghi mặc định mỗi trang */
    protected int $defaultLimit = 15;
    protected int $defaultPage  = 1;

    /**
     * Whitelist cột sort cho getList().
     * [] = không giới hạn (chỉ dùng khi FormRequest đã validate chặt).
     */
    protected array $allowedSortColumns = [];

    /**
     * Cột select cho getForSelect() — domain override khi cần.
     * Ví dụ: Club = ['id', 'max_members', 'logo'], User = ['id', 'fullname']
     */
    protected array $selectColumns      = ['id'];

    /**
     * Eager-load relations cho getForSelect().
     * Ví dụ: Club = ['translations']
     */
    protected array $selectWith         = [];

    /** Limit mặc định / tối đa cho getForSelect() */
    protected int $selectDefaultLimit   = 20;
    protected int $selectMaxLimit       = 50;

    use HasTranslationSlug;

    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    // =========================================================================
    // HOOK METHODS — Domain Repository override để thêm filter/search riêng
    // =========================================================================

    /**
     * Hook: full-text search.
     * Repository con override để search qua translations, email, tên...
     */
    protected function applySearch(Builder $query, array $filters): void {}

    /**
     * Hook: filter đặc thù của domain (trừ search).
     * Repository con override, gọi các helper apply*Filter.
     * Ví dụ: applyActiveFilter, applyStatusFilter, applyDateFilter...
     */
    protected function applyFilters(Builder $query, array $filters): void {}

    /**
     * Hook: query cơ sở cho getList() / getCursorList().
     * Repository con override để thêm select cụ thể, with(), withCount()...
     * Mặc định: model query không select/with gì thêm.
     */
    protected function baseListQuery(): Builder
    {
        return $this->model->newQuery();
    }

    /**
     * Hook: query cơ sở cho getForSelect().
     * Dùng $selectColumns + $selectWith. Override nếu cần join hay withCount.
     */
    protected function baseSelectQuery(): Builder
    {
        $query = $this->model->select($this->selectColumns);

        if (!empty($this->selectWith)) {
            $query->with($this->selectWith);
        }

        return $query;
    }

    /**
     * Hook: thứ tự sort cho getCursorList().
     * Cursor pagination phải orderBy cột unique — domain override nếu cần.
     * Mặc định: defaultOrderBy (nếu khác id) + id làm tie-breaker.
     */
    protected function applyCursorOrder(Builder $query): void
    {
        if ($this->defaultOrderBy !== 'id') {
            $query->orderBy($this->defaultOrderBy, $this->defaultOrderDirection);
        }

        $query->orderBy('id', 'desc');
    }

    // =========================================================================
    // STANDARD LIST METHODS — dùng chung toàn bộ domain qua hooks
    // =========================================================================

    /**
     * Offset pagination chuẩn (cho admin list, table có pager).
     *
     * Mọi filter domain đều xử lý trong applySearch() + applyFilters().
     * Service KHÔNG build query, chỉ truyền $filters xuống đây.
     *
     * Filters chuẩn (thêm filter riêng ở applyFilters()):
     *   search   string   — full-text search
     *   sort_by  string   — cột sort (whitelist: $allowedSortColumns)
     *   sort_dir asc|desc
     *   limit    int
     *   page     int
     */
    public function getList(array $filters = []): \Illuminate\Contracts\Pagination\LengthAwarePaginator
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
     * Cursor pagination (cho UI infinite scroll / bảng lớn).
     *
     * Thứ tự sort do applyCursorOrder() quyết định.
     * Filter giống getList().
     */
    public function getCursorList(array $filters = []): \Illuminate\Contracts\Pagination\CursorPaginator
    {
        $query = $this->baseListQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applyCursorOrder($query);

        return $query->cursorPaginate($filters['limit'] ?? $this->defaultLimit);
    }

    /**
     * Dropdown / select list — nhẹ, không phân trang, không Resource.
     *
     * Cột trả về do $selectColumns + $selectWith quyết định.
     * Limit cap tại $selectMaxLimit.
     */
    public function getForSelect(array $filters = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = $this->baseSelectQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        $query->orderBy($this->defaultOrderBy, $this->defaultOrderDirection);

        return $query
            ->limit(min((int) ($filters['limit'] ?? $this->selectDefaultLimit), $this->selectMaxLimit))
            ->get();
    }

    /**
     * Đếm bản ghi theo filter — dùng cho badge / thống kê.
     */
    public function countFiltered(array $filters = []): int
    {
        $query = $this->model->newQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        return $query->count();
    }

    // =========================================================================
    // FILTER / SORT HELPERS
    // Thao tác trực tiếp lên Query Builder, đọc giá trị từ mảng $filters.
    // Quy ước: bỏ qua key không tồn tại hoặc rỗng.
    // =========================================================================

    /**
     * Sort theo $filters['sort_by'] / $filters['sort_dir'].
     *
     * @param array $allowedColumns  whitelist ([] = cho phép mọi cột)
     */
    protected function applySorting(Builder $query, array $filters, array $allowedColumns = []): void
    {
        $direction = strtolower((string) ($filters['sort_dir'] ?? $this->defaultOrderDirection));
        if (!in_array($direction, ['asc', 'desc'], true)) {
            $direction = $this->defaultOrderDirection;
        }

        $column = $filters['sort_by'] ?? null;

        if ($column === null || $column === '') {
            $column = $this->defaultOrderBy;
        } elseif (!empty($allowedColumns) && !in_array($column, $allowedColumns, true)) {
            $column = $this->defaultOrderBy;
        }

        $query->orderBy($column, $direction);

        // Tie-breaker để kết quả phân trang ổn định
        if ($column !== 'id') {
            $query->orderBy('id', $direction);
        }
    }

    /**
     * Boolean filter: $filters[$key] = 0|1|true|false|'true'|'false'.
     *
     * @param string      $key     key trong $filters
     * @param string|null $column  cột DB (mặc định = $key)
     */
    protected function applyBooleanFilter(Builder $query, array $filters, string $key, ?string $column = null): void
    {
        if (!array_key_exists($key, $filters)) {
            return;
        }
        $value = $filters[$key];
        if ($value === null || $value === '') {
            return;
        }

        $query->where($column ?? $key, filter_var($value, FILTER_VALIDATE_BOOLEAN));
    }

    /**
     * Convenience cho cột is_active — filter phổ biến nhất.
     */
    protected function applyActiveFilter(Builder $query, array $filters, ?string $column = 'is_active'): void
    {
        $this->applyBooleanFilter($query, $filters, 'is_active', $column);
    }

    /**
     * Status (string) filter — chỉ chấp nhận giá trị trong $allowedStatuses.
     *
     * @param string $key
     * @param array  $allowedStatuses  whitelist giá trị status
     * @param string|null $column      cột DB (mặc định = $key)
     */
    protected function applyStatusFilter(
        Builder $query,
        array   $filters,
        string  $key,
        array   $allowedStatuses,
        ?string $column = null
    ): void {
        if (!array_key_exists($key, $filters)) {
            return;
        }
        $value = $filters[$key];
        if ($value === null || $value === '') {
            return;
        }
        if (!empty($allowedStatuses) && !in_array($value, $allowedStatuses, true)) {
            return;
        }

        $query->where($column ?? $key, $value);
    }

    /**
     * Date range filter theo $filters["{$key}_from"] / $filters["{$key}_to"].
     *
     * Ví dụ: applyDateFilter($query, $filters, 'created_at')
     *     → whereDate(created_at, '>=', filters['created_at_from'])
     *       whereDate(created_at, '<=', filters['created_at_to'])
     */
    protected function applyDateFilter(Builder $query, array $filters, string $key, ?string $column = null): void
    {
        $column = $column ?? $key;
        $from   = $filters["{$key}_from"] ?? null;
        $to     = $filters["{$key}_to"]   ?? null;

        if ($from !== null && $from !== '') {
            $query->whereDate($column, '>=', $from);
        }
        if ($to !== null && $to !== '') {
            $query->whereDate($column, '<=', $to);
        }
    }

    // =========================================================================
    // QUERY CONDITION HELPERS (cho first() / get() / paginate() kiểu cũ)
    // =========================================================================

    /**
     * Áp điều kiện linh hoạt vào query.
     *
     * Hỗ trợ:
     *   'field'    => 'value'                          → where field = value
     *   'field'    => ['field', 'like', 'abc']         → where field like %abc%
     *   'field'    => ['field', 'whereIn', [1,2,3]]    → whereIn
     *   'field'    => ['field', 'whereBetween', [a,b]] → whereBetween
     *   'orWhere'  => ['field1' => 'val1', ...]        → orWhere group
     *   'whereHas' => [['relation', ['field'=>'val']]] → whereHas relation
     *   'whereRaw' => 'SQL string'                     → whereRaw
     */
    protected function applyConditions(Builder &$query, array $where): void
    {
        foreach ($where as $field => $value) {
            match ($field) {
                'orWhere' => $query->where(function ($q) use ($value) {
                    foreach ($value as $f => $v) {
                        $this->applyWhere($q, $f, $v, 'orWhere');
                    }
                }),
                'whereRaw' => $query->whereRaw($value),
                'whereHas' => (function () use (&$query, $value) {
                    foreach ($value as [$relation, $conditions]) {
                        $query->whereHas($relation, function ($q) use ($conditions) {
                            foreach ($conditions as $f => $v) {
                                $this->applyWhere($q, $f, $v);
                            }
                        });
                    }
                })(),
                default => $this->applyWhere($query, $field, $value),
            };
        }
    }

    /**
     * Áp 1 điều kiện đơn vào query.
     * $value có thể là scalar hoặc array dạng [$field, $operator, $val].
     */
    protected function applyWhere(Builder &$query, string $field, mixed $value, string $method = 'where'): void
    {
        if (!is_array($value)) {
            $query->$method($field, $value);
            return;
        }

        [$col, $condition, $val] = $value;

        match ($condition) {
            'whereIn'      => $query->whereIn($col, $val),
            'whereNotIn'   => $query->whereNotIn($col, $val),
            'whereBetween' => $query->whereBetween($col, $val),
            'whereNotNull' => $query->whereNotNull($col),
            'whereNull'    => $query->whereNull($col),
            'like'         => $query->$method($col, 'like', '%' . $val . '%'),
            default        => $query->$method($col, $condition, $val),
        };
    }

    /**
     * Áp sort vào query từ mảng ['column' => 'direction'].
     */
    protected function applyOrderBy(Builder &$query, array $orderBy): void
    {
        foreach ($orderBy as $column => $direction) {
            $query->orderBy($column, $direction);
        }
    }

    // =========================================================================
    // READ
    // =========================================================================

    public function all(array $orderBy = [], array $select = ['*']): \Illuminate\Database\Eloquent\Collection
    {
        $query = $this->model->select($select);

        if (!empty($orderBy)) {
            $this->applyOrderBy($query, $orderBy);
        } else {
            $query->orderBy('id', 'desc');
        }

        return $query->get();
    }

    public function find(int $id, array $columns = ['*']): ?Model
    {
        return $this->model->select($columns)->find($id);
    }

    public function findOrFail(int $id): Model
    {
        return $this->model->findOrFail($id);
    }

    public function findBySlug(string $slug, array $columns = ['*'], array $conditions = []): ?Model
    {
        $query = $this->model->select($columns)->where('slug', $slug);

        foreach ($conditions as $key => $value) {
            $query->where($key, $value);
        }

        return $query->first();
    }

    public function findByTranslationSlug(
        string $slug,
        array  $columns    = ['*'],
        array  $conditions = [],
    ): ?Model {
        $query = $this->model
            ->select($columns)
            ->whereHas('translations', fn($q) => $q->where('slug', $slug))
            ->with('translations');

        foreach ($conditions as $key => $value) {
            $query->where($key, $value);
        }

        return $query->first();
    }

    public function first(
        array $where   = [],
        array $orderBy = [],
        array $select  = ['*'],
        array $with    = []
    ): ?Model {
        $query = $this->model->select($select);

        if (!empty($with)) {
            $query->with($with);
        }
        if (!empty($where)) {
            $this->applyConditions($query, $where);
        }
        if (!empty($orderBy)) {
            $this->applyOrderBy($query, $orderBy);
        }

        return $query->first();
    }

    public function firstOrCreate(array $where, array $values = []): Model
    {
        return $this->model->firstOrCreate($where, $values);
    }

    public function get(
        array $where   = [],
        array $orderBy = [],
        array $select  = ['*'],
        array $with    = [],
        int   $limit   = 0
    ): \Illuminate\Database\Eloquent\Collection {
        $query = $this->model->select($select);

        if (!empty($with)) {
            $query->with($with);
        }
        if (!empty($where)) {
            $this->applyConditions($query, $where);
        }
        if (!empty($orderBy)) {
            $this->applyOrderBy($query, $orderBy);
        }
        if ($limit > 0) {
            $query->limit($limit);
        }

        return $query->get();
    }

    /**
     * Phân trang kiểu cũ (truyền where array thay vì $filters).
     * Vẫn giữ để tương thích — ưu tiên dùng getList() cho code mới.
     */
    public function paginate(
        array $where   = [],
        array $orderBy = [],
        array $select  = ['*'],
        array $with    = [],
        int   $limit   = 0,
        int   $page    = 1
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        $limit = $limit ?: $this->defaultLimit;
        $page  = $page  ?: $this->defaultPage;
        $query = $this->model->select($select);

        if (!empty($with)) {
            $query->with($with);
        }
        if (!empty($where)) {
            $this->applyConditions($query, $where);
        }
        if (!empty($orderBy)) {
            $this->applyOrderBy($query, $orderBy);
        } else {
            $query->orderBy($this->defaultOrderBy, $this->defaultOrderDirection);
        }

        return $query->paginate($limit, ['*'], 'page', $page);
    }

    /**
     * Cursor pagination kiểu cũ.
     * Vẫn giữ để tương thích — ưu tiên dùng getCursorList() cho code mới.
     */
    public function cursorPaginate(
        array $where   = [],
        array $orderBy = [],
        array $select  = ['*'],
        array $with    = [],
        int   $limit   = 0
    ): \Illuminate\Contracts\Pagination\CursorPaginator {
        $limit = $limit ?: $this->defaultLimit;
        $query = $this->model->select($select);

        if (!empty($with)) {
            $query->with($with);
        }
        if (!empty($where)) {
            $this->applyConditions($query, $where);
        }
        if (!empty($orderBy)) {
            $this->applyOrderBy($query, $orderBy);
        } else {
            $query->orderBy('id', 'desc');
        }

        return $query->cursorPaginate($limit);
    }

    public function getActive(array $select = ['*'], array $with = []): \Illuminate\Database\Eloquent\Collection
    {
        $query = $this->model->select($select);

        if (!empty($with)) {
            $query->with($with);
        }

        if (method_exists($this->model, 'scopeActive')) {
            $query->active();
        } else {
            $query->where('is_active', true);
        }

        return $query->orderBy($this->defaultOrderBy, $this->defaultOrderDirection)->get();
    }

    public function pluck(string $column, ?string $key = null): \Illuminate\Support\Collection
    {
        return $this->model->pluck($column, $key);
    }

    public function pluckWhere(
        array   $where,
        string  $column,
        ?string $key   = null,
        int     $limit = 0
    ): \Illuminate\Support\Collection {
        $query = $this->model->newQuery();
        $this->applyConditions($query, $where);

        if ($limit > 0) {
            $query->limit($limit);
        }

        return $query->pluck($column, $key);
    }

    public function count(array $where = []): int
    {
        $query = $this->model->newQuery();
        if (!empty($where)) {
            $this->applyConditions($query, $where);
        }
        return $query->count();
    }

    public function sum(string $field, array $where = []): float|int
    {
        $query = $this->model->newQuery();
        if (!empty($where)) {
            $this->applyConditions($query, $where);
        }
        return $query->sum($field);
    }

    // =========================================================================
    // WRITE
    // =========================================================================

    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    public function bulkInsert(array $data): bool
    {
        return $this->model->insert($data);
    }

    public function update(Model $model, array $data): Model
    {
        $model->update($data);
        return $model->fresh();
    }

    public function editWhere(array $where, array $data): int
    {
        $query = $this->model->newQuery();
        $this->applyConditions($query, $where);
        return $query->update($data);
    }

    public function updateOrCreate(array $attributes, array $values = []): Model
    {
        return $this->model->updateOrCreate($attributes, $values);
    }

    public function upsert(array $data, array $uniqueBy, array $updateColumns): bool
    {
        return $this->model->upsert($data, $uniqueBy, $updateColumns);
    }

    public function delete(Model $model): bool
    {
        return $model->delete();
    }

    public function deleteWhere(array $where): bool
    {
        $query = $this->model->newQuery();
        $this->applyConditions($query, $where);
        $query->delete();
        return true;
    }

    // =========================================================================
    // NUMERIC
    // =========================================================================

    public function increment(array $where, string $column, int $value = 1): int
    {
        $query = $this->model->newQuery();
        $this->applyConditions($query, $where);
        return $query->increment($column, $value);
    }

    public function decrement(array $where, string $column, int $value = 1): int
    {
        $query = $this->model->newQuery();
        $this->applyConditions($query, $where);
        return $query->decrement($column, $value);
    }

    // =========================================================================
    // SORT ORDER
    // =========================================================================

    public function getNextSortOrder(string $column = 'sort_order'): int
    {
        return ($this->model->max($column) ?? 0) + 1;
    }

    public function applySortOrder(int $newOrder, ?int $id = null, ?int $oldOrder = null): void
    {
        if (is_null($oldOrder)) {
            $this->model->newQuery()
                ->where('sort_order', '>=', $newOrder)
                ->when($id, fn($q) => $q->where('id', '!=', $id))
                ->increment('sort_order');
            return;
        }

        if ($oldOrder === $newOrder) return;

        if ($oldOrder < $newOrder) {
            $this->model->newQuery()
                ->where('id', '!=', $id)
                ->whereBetween('sort_order', [$oldOrder + 1, $newOrder])
                ->decrement('sort_order');
        } else {
            $this->model->newQuery()
                ->where('id', '!=', $id)
                ->whereBetween('sort_order', [$newOrder, $oldOrder - 1])
                ->increment('sort_order');
        }
    }

    public function decrementSortOrderAfterDelete(int $deletedOrder, ?int $id = null): int
    {
        return $this->model->newQuery()
            ->where('sort_order', '>', $deletedOrder)
            ->when($id, fn($q) => $q->where('id', '!=', $id))
            ->decrement('sort_order');
    }

    // =========================================================================
    // TRANSLATION HELPERS
    // =========================================================================

    public function createWithTranslations(array $data, array $translations): Model
    {
        return DB::transaction(function () use ($data, $translations) {
            $model = $this->model->create($data);
            $rows  = $this->normalizeTranslations($translations);
            $rows  = $this->prepareTranslationSlugs($rows);
            $model->translations()->createMany($rows);
            return $model->load('translations');
        });
    }

    public function updateWithTranslations(Model $model, array $data, array $translations): Model
    {
        return DB::transaction(function () use ($model, $data, $translations) {
            $model->update($data);
            $rows = $this->normalizeTranslations($translations);
            $rows = $this->prepareTranslationSlugs($rows);
            foreach ($rows as $row) {
                $model->translations()->updateOrCreate(
                    ['locale' => $row['locale']],
                    $row
                );
            }
            return $model->fresh('translations');
        });
    }

    /**
     * Chuẩn hoá mảng translations về dạng indexed với 'locale' key.
     *
     * Chấp nhận cả hai format:
     *   - Mới (locale làm key): ['vi' => ['name' => 'Abc'], 'en' => [...]]
     *   - Cũ (indexed array) : [['locale' => 'vi', 'name' => 'Abc'], ...]
     */
    protected function normalizeTranslations(array $translations): array
    {
        if (!empty($translations) && is_string(array_key_first($translations))) {
            $rows = [];
            foreach ($translations as $locale => $fields) {
                $rows[] = array_merge(['locale' => $locale], $fields);
            }
            return $rows;
        }
        return $translations;
    }
}

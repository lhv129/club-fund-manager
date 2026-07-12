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

    /** Override ở Repository con để đổi sort mặc định */
    protected string $defaultOrderBy = 'id';
    protected string $defaultOrderDirection = 'desc';

    /** Số bản ghi mặc định mỗi trang */
    protected int $defaultLimit = 15;
    protected int $defaultPage = 1;

    use HasTranslationSlug;


    public function __construct(Model $model)
    {
        $this->model = $model;
    }

    // -------------------------------------------------------------------------
    // Query helpers
    // -------------------------------------------------------------------------

    /**
     * Áp điều kiện linh hoạt vào query
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
     * Áp 1 điều kiện đơn vào query
     *
     * $value có thể là scalar hoặc array dạng [$field, $operator, $val]
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
     * Áp sort vào query
     *
     * $orderBy = ['created_at' => 'desc', 'name' => 'asc']
     */
    protected function applyOrderBy(Builder &$query, array $orderBy): void
    {
        foreach ($orderBy as $column => $direction) {
            $query->orderBy($column, $direction);
        }
    }

    // -------------------------------------------------------------------------
    // Read
    // -------------------------------------------------------------------------

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
     * Phân trang linh hoạt — dùng cho danh sách API
     */
    public function paginate(
        array $where   = [],
        array $orderBy = [],
        array $select  = ['*'],
        array $with    = [],
        int   $limit   = 0,
        int  $page    = 1
    ): \Illuminate\Contracts\Pagination\LengthAwarePaginator {
        $limit = $limit ?: $this->defaultLimit;
        $page = $page ?: $this->defaultPage;
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
     * Cursor pagination — hiệu năng cao cho bảng lớn (triệu record)
     *
     * Dùng khi:
     *   - Bảng có > 100k record
     *   - UI dạng infinite scroll / "load more"
     *   - Không cần nhảy đến trang cụ thể
     *
     * KHÔNG dùng khi:
     *   - Cần hiển thị "trang 5 / 100"
     *   - Cần nhảy đến trang bất kỳ
     *
     * @param array $where    điều kiện lọc
     * @param array $orderBy  PHẢI có cột unique (id hoặc created_at+id)
     * @param array $select   cột cần lấy
     * @param array $with     eager load
     * @param int   $limit    số record mỗi trang
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
            // Cursor pagination bắt buộc orderBy cột unique
            // Dùng id DESC thay vì sort_order vì id luôn unique
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
        int $limit = 0       // 0 = không giới hạn
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

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

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

    /**
     * Bulk update theo điều kiện
     *
     * $repo->editWhere(['status' => 'pending'], ['status' => 'done'])
     */
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

    /**
     * Bulk delete theo điều kiện
     *
     * $repo->deleteWhere(['status' => 'expired'])
     */
    public function deleteWhere(array $where): bool
    {
        $query = $this->model->newQuery();
        $this->applyConditions($query, $where);
        $query->delete();
        return true;
    }

    // -------------------------------------------------------------------------
    // Numeric
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Sort order
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Translation helpers
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // Translation helpers
    // -------------------------------------------------------------------------
    public function createWithTranslations(array $data, array $translations): Model
    {
        return DB::transaction(function () use ($data, $translations) {
            $model = $this->model->create($data);
            // Chuẩn hoá: ['vi' => ['name' => ...]] → [['locale' => 'vi', 'name' => ...]]
            $rows = $this->normalizeTranslations($translations);
            $rows = $this->prepareTranslationSlugs($rows, $model->getTable());
            $model->translations()->createMany($rows);
            return $model->load('translations');
        });
    }
    public function updateWithTranslations(Model $model, array $data, array $translations): Model
    {
        return DB::transaction(function () use ($model, $data, $translations) {
            $model->update($data);
            // Chuẩn hoá: ['vi' => ['name' => ...]] → [['locale' => 'vi', 'name' => ...]]
            $rows = $this->normalizeTranslations($translations);
            $rows = $this->prepareTranslationSlugs($rows, $model->getTable(), $model->getKey());
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
     *   - Mới (locale làm key): ['vi' => ['name' => 'Abc'], 'en' => ['name' => 'Def']]
     *   - Cũ (indexed array) : [['locale' => 'vi', 'name' => 'Abc'], ...]
     */
    protected function normalizeTranslations(array $translations): array
    {
        // Nếu key đầu tiên là string → format mới
        if (!empty($translations) && is_string(array_key_first($translations))) {
            $rows = [];
            foreach ($translations as $locale => $fields) {
                $rows[] = array_merge(['locale' => $locale], $fields);
            }
            return $rows;
        }
        // Format cũ — giữ nguyên
        return $translations;
    }
}

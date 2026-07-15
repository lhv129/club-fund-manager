<?php

namespace App\Domains\Module\Repositories;

use App\Base\BaseRepository;
use App\Domains\Module\Models\Module;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ModuleRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Module $model)
    {
        parent::__construct($model);
    }

    /**
     * Danh sách module (offset pagination).
     * Toàn bộ filter/search/sort nằm ở đây — Service chỉ truyền $filters.
     */
    public function paginateModule(array $filters = []): LengthAwarePaginator
    {
        $query = $this->model
            ->select(['id', 'slug', 'sort_order', 'is_active', 'created_at'])
            ->with(['translations']);

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters, ['id', 'sort_order', 'created_at']);

        return $query->paginate($filters['limit'] ?? $this->defaultLimit);
    }

    /**
     * Dropdown list — KHÔNG dùng Resource, trả Collection thường.
     */
    public function getForSelect(array $filters = []): Collection
    {
        $query = $this->model
            ->select(['id', 'slug', 'icon'])
            ->with(['translations']);

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        $query->orderBy('sort_order', 'asc')->orderBy('id', 'asc');

        return $query->limit(min((int) ($filters['limit'] ?? 50), 100))->get();
    }

    // ------------------------------------------------------------------
    // Domain-specific filter builders
    // ------------------------------------------------------------------

    /** Search theo slug + name qua relationship translations. */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('slug', 'like', "%{$search}%")
                    ->orWhereHas('translations', fn ($qt) => $qt->where('name', 'like', "%{$search}%"));
            });
        }
    }

    /** Filter theo các cột đơn giản — dùng helper BaseRepository. */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
    }
}

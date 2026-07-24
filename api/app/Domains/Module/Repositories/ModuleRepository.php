<?php

namespace App\Domains\Module\Repositories;

use App\Base\BaseRepository;
use App\Domains\Module\Models\Module;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ModuleRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Module $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Read
    // ------------------------------------------------------------------

    /**
     * Danh sách có phân trang — dùng cho màn hình CRUD module.
     * Eager load translation (locale-scoped hasOne) + permissions.
     */
    public function getList(array $filters = []): LengthAwarePaginator
    {
        $query = $this->model
            ->select(['id', 'slug', 'sort_order', 'is_active', 'created_at'])
            ->with([
                'translations',
                'permissions' => fn($q) => $q->orderBy('sort_order'),
            ]);

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applySorting($query, $filters, ['id', 'sort_order', 'created_at']);

        return $query->paginate($filters['limit'] ?? $this->defaultLimit);
    }

    public function getForSelect(array $filters = []): Collection
    {
        $query = $this->model
            ->select(['id', 'slug', 'sort_order'])
            ->with('translation');

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $query->orderBy('sort_order', 'asc');

        return $query->limit(min((int) ($filters['limit'] ?? 50), 100))->get();
    }

    public function findById(int $id): ?Module
    {
        return $this->model
            ->with([
                'translations',
                'permissions' => fn($q) => $q->orderBy('sort_order'),
            ])
            ->find($id);
    }

    public function findByModuleSlug(string $slug, bool $withTrashed = false): ?Module
    {
        $query = $this->model
            ->with(['translations', 'permissions'])
            ->where('slug', $slug);

        return $withTrashed ? $query->withTrashed()->first() : $query->first();
    }

    /**
     * Toàn bộ modules kèm permissions — dùng cho màn hình assign permission của role.
     */
    public function getAllWithPermissions(): Collection
    {
        return $this->model
            ->with([
                'translation',
                'permissions' => fn($q) => $q->orderBy('sort_order'),
            ])
            ->orderBy('sort_order')
            ->get();
    }

    // ------------------------------------------------------------------
    // Domain-specific filters
    // ------------------------------------------------------------------

    protected function applySearch(Builder $query, array $filters): void
    {
        if (empty($filters['search'])) {
            return;
        }

        $search = $filters['search'];

        $query->where(function (Builder $q) use ($search) {
            $q->where('slug', 'like', "%{$search}%")
                ->orWhereHas(
                    'translations',
                    fn(Builder $qt) =>
                    $qt->where('name', 'like', "%{$search}%")
                );
        });
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
    }
}

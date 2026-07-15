<?php

namespace App\Domains\Permission\Repositories;

use App\Base\BaseRepository;
use App\Domains\Permission\Models\Permission;
use Illuminate\Database\Eloquent\Builder;

class PermissionRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'sort_order';

    protected string $defaultOrderDirection = 'asc';

    protected array $allowedSortColumns = [
        'id',
        'module_id',
        'action',
        'sort_order',
        'created_at',
    ];

    protected array $selectColumns = [
        'id',
        'module_id',
        'action',
    ];

    public function __construct(Permission $model)
    {
        parent::__construct($model);
    }

    /**
     * Query cơ sở.
     */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'module_id',
                'action',
                'sort_order',
                'is_active',
                'created_at',
            ])
            ->with([
                'translations',
                'module.translations',
            ]);
    }

    /**
     * Search theo translations.name
     */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (empty($filters['search'])) {
            return;
        }

        $search = $filters['search'];

        $query->whereHas('translations', function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%");
        });
    }

    /**
     * Filter.
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (
            isset($filters['module_id'])
            && $filters['module_id'] !== ''
            && $filters['module_id'] !== null
        ) {
            $query->where('module_id', $filters['module_id']);
        }

        if (
            isset($filters['action'])
            && $filters['action'] !== ''
            && $filters['action'] !== null
        ) {
            $query->where('action', $filters['action']);
        }
    }

    /**
     * Group theo module.
     */
    public function getGroupedByModule(array $filters = []): array
    {
        $query = $this->baseListQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        return $query
            ->orderBy('module_id')
            ->orderBy('sort_order')
            ->get()
            ->groupBy('module_id')
            ->map(fn($items) => [
                'module' => $items->first()->module,
                'permissions' => $items->values(),
            ])
            ->values()
            ->toArray();
    }
}

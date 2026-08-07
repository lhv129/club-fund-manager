<?php

namespace App\Domains\Bank\Repositories;

use App\Base\BaseRepository;
use App\Domains\Bank\Models\Bank;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class BankRepository extends BaseRepository
{
    // ------------------------------------------------------------------
    // Config
    // ------------------------------------------------------------------

    protected string $defaultOrderBy = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    protected array $allowedSortColumns = [
        'id',
        'code',
        'name',
        'short_name',
        'sort_order',
        'created_at',
    ];

    protected array $selectColumns = [
        'id',
        'code',
        'name',
        'logo'
    ];

    protected array $selectWith = [];

    public function __construct(Bank $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Hooks
    // ------------------------------------------------------------------

    protected function baseListQuery(): Builder
    {
        return $this->model->select([
            'id',
            'code',
            'name',
            'short_name',
            'logo',
            'bin',
            'swift_code',
            'sort_order',
            'is_active',
            'created_at',
        ]);
    }

    protected function applySearch(Builder $query, array $filters): void
    {
        if (empty($filters['search'])) {
            return;
        }

        $search = trim($filters['search']);

        $query->where(function (Builder $q) use ($search) {
            $q->where('code', 'like', "%{$search}%")
                ->orWhere('name', 'like', "%{$search}%")
                ->orWhere('short_name', 'like', "%{$search}%")
                ->orWhere('bin', 'like', "%{$search}%");
        });
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
    }

    // ------------------------------------------------------------------
    // Lists
    // ------------------------------------------------------------------

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

    public function getCursorList(array $filters = []): CursorPaginator
    {
        $query = $this->baseListQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applyCursorOrder($query);

        return $query->cursorPaginate(
            $filters['limit'] ?? $this->defaultLimit
        );
    }

    public function getForSelect(array $filters = []): Collection
    {
        $query = $this->baseSelectQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        $query->orderBy(
            $this->defaultOrderBy,
            $this->defaultOrderDirection
        );

        return $query
            ->limit(
                min(
                    (int) ($filters['limit'] ?? $this->selectDefaultLimit),
                    $this->selectMaxLimit
                )
            )
            ->get();
    }
}

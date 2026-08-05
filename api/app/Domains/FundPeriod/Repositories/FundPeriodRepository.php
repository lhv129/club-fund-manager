<?php

namespace App\Domains\FundPeriod\Repositories;

use App\Base\BaseRepository;
use App\Domains\FundPeriod\Models\FundPeriod;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class FundPeriodRepository extends BaseRepository
{
    // ------------------------------------------------------------------
    // Cấu hình — Base sử dụng trực tiếp
    // ------------------------------------------------------------------

    /** FundPeriod mặc định sort theo year desc, month desc (kỳ mới nhất trước) */
    protected string $defaultOrderBy        = 'year';
    protected string $defaultOrderDirection = 'desc';

    /** Whitelist cột sort cho getList() — chống cột lạ xuống Query Builder */
    protected array $allowedSortColumns = ['id', 'year', 'month', 'sort_order', 'created_at'];

    /** Cột cho getForSelect() — dropdown trả [{id, year, month, ...}] */
    protected array $selectColumns = ['id', 'club_id', 'year', 'month', 'is_active'];
    protected array $selectWith    = ['translations:id,fund_period_id,locale,title'];

    public function __construct(FundPeriod $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Hook overrides
    // ------------------------------------------------------------------

    /**
     * Query cơ sở cho getList() / getCursorList().
     */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'year',
                'month',
                'male_amount',
                'female_amount',
                'exchange_male_amount',
                'exchange_female_amount',
                'is_locked',
                'is_active',
                'sort_order',
                'created_at',
            ])
            ->with(['translations:id,fund_period_id,locale,title']);
    }

    /**
     * Search theo title trong translations hoặc year/month.
     */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->whereHas('translations', function ($t) use ($search) {
                    $t->where('title', 'like', "%{$search}%");
                })->orWhere('year', $search);
            });
        }
    }

    /**
     * Filter đặc thù FundPeriod: is_active + club_id + year + is_locked.
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (!empty($filters['club_id'])) {
            $query->where('club_id', (int) $filters['club_id']);
        }

        if (!empty($filters['year'])) {
            $query->where('year', (int) $filters['year']);
        }

        $this->applyBooleanFilter($query, $filters, 'is_locked');
    }

    // ------------------------------------------------------------------
    // Domain-specific list methods
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

        return $query->cursorPaginate($filters['limit'] ?? $this->defaultLimit);
    }

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
}

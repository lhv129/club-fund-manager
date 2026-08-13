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
    // CONFIG
    // ------------------------------------------------------------------

    protected string $defaultOrderBy = 'year';

    protected string $defaultOrderDirection = 'desc';

    protected array $allowedSortColumns = [
        'id',
        'year',
        'month',
        'sort_order',
        'created_at',
    ];

    protected array $selectColumns = [
        'id',
        'club_id',
        'year',
        'month',
        'is_active',
        'is_locked',
    ];

    protected array $selectWith = [
        'translations:id,fund_period_id,locale,title',
    ];

    public function __construct(
        FundPeriod $model
    ) {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // BASE LIST QUERY
    // ------------------------------------------------------------------

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
            ->with([
                'translations:id,fund_period_id,locale,title',
            ]);
    }

    // ------------------------------------------------------------------
    // SEARCH
    // ------------------------------------------------------------------

    protected function applySearch(
        Builder $query,
        array $filters
    ): void {
        if (empty($filters['search'])) {
            return;
        }

        $search = $filters['search'];

        $query->where(function ($q) use ($search) {
            $q->whereHas(
                'translations',
                function ($t) use ($search) {
                    $t->where(
                        'title',
                        'like',
                        "%{$search}%"
                    );
                }
            )
                ->orWhere('year', $search)
                ->orWhere('month', $search);
        });
    }

    // ------------------------------------------------------------------
    // FILTERS
    // ------------------------------------------------------------------

    protected function applyFilters(
        Builder $query,
        array $filters
    ): void {
        $this->applyActiveFilter(
            $query,
            $filters
        );

        // --------------------------------------------------------------
        // CLUB
        //
        // Có club_id:
        //   scope theo club.
        //
        // Không có club_id:
        //   global/super-admin -> không filter club.
        // --------------------------------------------------------------

        if (
            array_key_exists('club_id', $filters)
            && $filters['club_id'] !== null
            && $filters['club_id'] !== ''
        ) {
            $query->where(
                'club_id',
                (int) $filters['club_id']
            );
        }

        // --------------------------------------------------------------
        // YEAR
        // --------------------------------------------------------------

        if (
            array_key_exists('year', $filters)
            && $filters['year'] !== null
            && $filters['year'] !== ''
        ) {
            $query->where(
                'year',
                (int) $filters['year']
            );
        }

        // --------------------------------------------------------------
        // MONTH
        // --------------------------------------------------------------

        if (
            array_key_exists('month', $filters)
            && $filters['month'] !== null
            && $filters['month'] !== ''
        ) {
            $query->where(
                'month',
                (int) $filters['month']
            );
        }

        // --------------------------------------------------------------
        // LOCKED
        // --------------------------------------------------------------

        $this->applyBooleanFilter(
            $query,
            $filters,
            'is_locked'
        );
    }

    // ------------------------------------------------------------------
    // LIST
    // ------------------------------------------------------------------

    public function getList(
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->baseListQuery();

        $this->applySearch(
            $query,
            $filters
        );

        $this->applyFilters(
            $query,
            $filters
        );

        $this->applySorting(
            $query,
            $filters,
            $this->allowedSortColumns
        );

        return $query->paginate(
            $filters['limit'] ?? $this->defaultLimit,
            ['*'],
            'page',
            $filters['page'] ?? $this->defaultPage
        );
    }

    // ------------------------------------------------------------------
    // CURSOR
    // ------------------------------------------------------------------

    public function getCursorList(
        array $filters = []
    ): CursorPaginator {
        $query = $this->baseListQuery();

        $this->applySearch(
            $query,
            $filters
        );

        $this->applyFilters(
            $query,
            $filters
        );

        $this->applyCursorOrder(
            $query
        );

        return $query->cursorPaginate(
            $filters['limit'] ?? $this->defaultLimit
        );
    }

    // ------------------------------------------------------------------
    // SELECT
    // ------------------------------------------------------------------

    public function getForSelect(
        array $filters = []
    ): Collection {
        $query = $this->baseSelectQuery();

        $this->applySearch(
            $query,
            $filters
        );

        $this->applyFilters(
            $query,
            $filters
        );

        $query->orderBy(
            $this->defaultOrderBy,
            $this->defaultOrderDirection
        );

        return $query
            ->limit(
                min(
                    (int) (
                        $filters['limit']
                        ?? $this->selectDefaultLimit
                    ),
                    $this->selectMaxLimit
                )
            )
            ->get();
    }

    // ------------------------------------------------------------------
    // FIND BY SCOPE
    // ------------------------------------------------------------------

    /**
     * Tìm FundPeriod theo ID + optional club scope.
     *
     * $clubId !== null:
     *     WHERE id = ? AND club_id = ?
     *
     * $clubId === null:
     *     global/super-admin -> WHERE id = ?
     */
    public function findByScope(
        int $id,
        ?int $clubId,
        array $with = []
    ): ?FundPeriod {
        $query = $this->model
            ->newQuery()
            ->where('id', $id);

        if ($clubId !== null) {
            $query->where(
                'club_id',
                $clubId
            );
        }

        if (!empty($with)) {
            $query->with($with);
        }

        return $query->first();
    }

    /**
     * Tìm FundPeriod kể cả soft deleted theo scope.
     */
    public function findByScopeWithTrashed(
        int $id,
        ?int $clubId
    ): ?FundPeriod {
        $query = $this->model
            ->withTrashed()
            ->where('id', $id);

        if ($clubId !== null) {
            $query->where(
                'club_id',
                $clubId
            );
        }

        return $query->first();
    }

    // ------------------------------------------------------------------
    // FIND BY CLUB + YEAR + MONTH
    // ------------------------------------------------------------------

    /**
     * Check duplicate bao gồm cả soft deleted.
     */
    public function findByClubAndDateWithTrashed(
        int $clubId,
        int $year,
        int $month
    ): ?FundPeriod {
        return $this->model
            ->withTrashed()
            ->where('club_id', $clubId)
            ->where('year', $year)
            ->where('month', $month)
            ->first();
    }

    /**
     * Check duplicate khi update,
     * loại trừ chính record đang update.
     */
    public function findByClubAndDateWithTrashedExcept(
        int $clubId,
        int $year,
        int $month,
        int $exceptId
    ): ?FundPeriod {
        return $this->model
            ->withTrashed()
            ->where('club_id', $clubId)
            ->where('year', $year)
            ->where('month', $month)
            ->where('id', '!=', $exceptId)
            ->first();
    }

    // ------------------------------------------------------------------
    // FIND BY CLUB + DATE
    // ------------------------------------------------------------------

    public function findByClubAndDate(
        int $clubId,
        int $year,
        int $month
    ): ?FundPeriod {
        return $this->model
            ->where('club_id', $clubId)
            ->where('year', $year)
            ->where('month', $month)
            ->first();
    }

    // ------------------------------------------------------------------
    // LATEST ACTIVE
    // ------------------------------------------------------------------

    public function findLatestActiveForClub(
        int $clubId
    ): ?FundPeriod {
        return $this->model
            ->where('club_id', $clubId)
            ->where('is_active', true)
            ->where('is_locked', false)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->first();
    }
}

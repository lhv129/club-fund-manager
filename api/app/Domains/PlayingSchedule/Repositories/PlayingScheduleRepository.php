<?php

namespace App\Domains\PlayingSchedule\Repositories;

use App\Base\BaseRepository;
use App\Domains\PlayingSchedule\Models\PlayingSchedule;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class PlayingScheduleRepository extends BaseRepository
{
    /** PlayingSchedule mặc định sort theo weekday asc, rồi sort_order asc */
    protected string $defaultOrderBy        = 'weekday';
    protected string $defaultOrderDirection = 'asc';

    protected array $allowedSortColumns = ['id', 'weekday', 'sort_order', 'created_at'];

    protected array $selectColumns = ['id', 'club_id', 'weekday', 'start_time', 'end_time', 'is_active'];
    protected array $selectWith    = ['translations:id,playing_schedule_id,locale,title'];

    public function __construct(PlayingSchedule $model)
    {
        parent::__construct($model);
    }

    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'weekday',
                'court_name',
                'court_address',
                'start_time',
                'end_time',
                'auto_generate',
                'weeks_ahead',
                'start_date',
                'end_date',
                'is_active',
                'sort_order',
                'created_at',
            ])
            ->with(['translations:id,playing_schedule_id,locale,title']);
    }

    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->whereHas('translations', function ($t) use ($search) {
                    $t->where('title', 'like', "%{$search}%");
                })
                    ->orWhere('court_name', 'like', "%{$search}%")
                    ->orWhere('court_address', 'like', "%{$search}%");
            });
        }
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (!empty($filters['club_id'])) {
            $query->where('club_id', (int) $filters['club_id']);
        }

        if (isset($filters['weekday']) && $filters['weekday'] !== '' && $filters['weekday'] !== null) {
            $query->where('weekday', (int) $filters['weekday']);
        }
    }

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

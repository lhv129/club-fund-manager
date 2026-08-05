<?php

namespace App\Domains\ExchangeSession\Repositories;

use App\Base\BaseRepository;
use App\Domains\ExchangeSession\Models\ExchangeSession;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ExchangeSessionRepository extends BaseRepository
{
    /** ExchangeSession mặc định sort theo session_date desc (buổi gần nhất trước) */
    protected string $defaultOrderBy        = 'session_date';
    protected string $defaultOrderDirection = 'desc';

    protected array $allowedSortColumns = ['id', 'session_date', 'status', 'type', 'sort_order', 'created_at'];

    protected array $selectColumns = ['id', 'club_id', 'session_date', 'status', 'is_active'];
    protected array $selectWith    = ['translations:id,exchange_session_id,locale,title'];

    public function __construct(ExchangeSession $model)
    {
        parent::__construct($model);
    }

    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'playing_schedule_id',
                'transaction_id',
                'session_date',
                'court_name',
                'court_address',
                'start_time',
                'end_time',
                'type',
                'status',
                'player_count',
                'amount_per_player',
                'total_amount',
                'is_active',
                'sort_order',
                'created_at',
            ])
            ->with(['translations:id,exchange_session_id,locale,title']);
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

        if (!empty($filters['playing_schedule_id'])) {
            $query->where('playing_schedule_id', (int) $filters['playing_schedule_id']);
        }

        $this->applyStatusFilter($query, $filters, 'status', ['upcoming', 'completed', 'cancelled']);
        $this->applyStatusFilter($query, $filters, 'type', ['scheduled', 'manual']);
        $this->applyDateFilter($query, $filters, 'session_date');
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

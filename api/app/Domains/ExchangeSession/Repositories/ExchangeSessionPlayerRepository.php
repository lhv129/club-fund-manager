<?php

namespace App\Domains\ExchangeSession\Repositories;

use App\Base\BaseRepository;
use App\Domains\ExchangeSession\Models\ExchangeSessionPlayer;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ExchangeSessionPlayerRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    protected array $allowedSortColumns = ['id', 'amount', 'sort_order', 'created_at'];

    protected array $selectColumns = ['id', 'exchange_session_id', 'user_id', 'player_name', 'amount', 'paid', 'checked_in'];
    protected array $selectWith    = [];

    public function __construct(ExchangeSessionPlayer $model)
    {
        parent::__construct($model);
    }

    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'exchange_session_id',
                'user_id',
                'player_name',
                'amount',
                'paid',
                'checked_in',
                'is_active',
                'sort_order',
                'created_at',
            ])
            ->with(['user:id,fullname']);
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (!empty($filters['exchange_session_id'])) {
            $query->where('exchange_session_id', (int) $filters['exchange_session_id']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        if (array_key_exists('paid', $filters) && $filters['paid'] !== null && $filters['paid'] !== '') {
            $query->where('paid', filter_var($filters['paid'], FILTER_VALIDATE_BOOLEAN));
        }

        if (array_key_exists('checked_in', $filters) && $filters['checked_in'] !== null && $filters['checked_in'] !== '') {
            $query->where('checked_in', filter_var($filters['checked_in'], FILTER_VALIDATE_BOOLEAN));
        }
    }

    public function getList(array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseListQuery();

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

        $this->applyFilters($query, $filters);
        $this->applyCursorOrder($query);

        return $query->cursorPaginate($filters['limit'] ?? $this->defaultLimit);
    }

    public function getForSelect(array $filters = []): Collection
    {
        $query = $this->baseSelectQuery();

        $this->applyFilters($query, $filters);
        $query->orderBy($this->defaultOrderBy, $this->defaultOrderDirection);

        return $query
            ->limit(min((int) ($filters['limit'] ?? $this->selectDefaultLimit), $this->selectMaxLimit))
            ->get();
    }
}

<?php

namespace App\Domains\ExchangeSession\Repositories;

use App\Base\BaseRepository;
use App\Domains\ExchangeSession\Models\ExchangeSession;
use App\Domains\ExchangeSession\Models\ExchangeSessionPlayer;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class ExchangeSessionPlayerRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'sort_order';

    protected string $defaultOrderDirection = 'asc';

    public function __construct(
        ExchangeSessionPlayer $model
    ) {
        parent::__construct($model);
    }

    /**
     * Base query cho ExchangeSessionPlayer.
     */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'exchange_session_id',
                'user_id',
                'player_name',
                'male',
                'female',
                'transaction_id',
                'amount',
                'paid',
                'is_active',
                'sort_order',
                'created_at',
                'updated_at'
            ])
            ->with([
                'user:id,fullname',
                'exchangeSession:id,session_date,playing_schedule_id,type,status',
                'exchangeSession.playingSchedule:id',
                'exchangeSession.playingSchedule.translations:id,playing_schedule_id,locale,title,note',
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | Player list
    |--------------------------------------------------------------------------
    */

    /**
     * Danh sách đối soát thu tiền giao lưu toàn CLB.
     *
     * Danh sách hỗ trợ:
     * - search
     * - paid
     * - pagination
     * - sorting
     *
     * club_id được truyền nội bộ từ Controller/Service,
     * không phải filter public của Request.
     */
    public function getPlayerList(
        array $filters = []
    ): LengthAwarePaginator {
        $query = $this->baseListQuery();

        if (!empty($filters['exchange_session_id'])) {
            $query->where('exchange_session_id', (int) $filters['exchange_session_id']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        /*
        |--------------------------------------------------------------------------
        | Club
        |--------------------------------------------------------------------------
        |
        | exchange_session_players không có club_id.
        | Phải đi qua exchangeSession để xác định CLB.
        |
        */
        if (!empty($filters['club_id'])) {
            $query->whereHas(
                'exchangeSession',
                function (Builder $sessionQuery) use ($filters) {
                    $sessionQuery->where(
                        'club_id',
                        (int) $filters['club_id']
                    );
                }
            );
        }

        /*
        |--------------------------------------------------------------------------
        | Search
        |--------------------------------------------------------------------------
        |
        | Tìm:
        | - tên member mang nhóm
        | - tên khách trong player_name
        |
        */
        $this->applyPlayerSearch(
            $query,
            $filters
        );

        /*
        |--------------------------------------------------------------------------
        | Paid
        |--------------------------------------------------------------------------
        |
        | paid = true  => đã đóng
        | paid = false => chưa đóng
        | không truyền => tất cả
        |
        */
        $this->applyPlayerPaidFilter(
            $query,
            $filters
        );

        /*
        |--------------------------------------------------------------------------
        | Sorting
        |--------------------------------------------------------------------------
        */
        $this->applyPlayerSorting(
            $query,
            $filters
        );

        return $query->paginate(
            $filters['limit'] ?? $this->defaultLimit,
            ['*'],
            'page',
            $filters['page'] ?? $this->defaultPage
        );
    }

    /**
     * Search players.
     *
     * Search theo:
     * - user.fullname
     * - player_name
     */
    protected function applyPlayerSearch(
        Builder $query,
        array $filters
    ): void {
        if (
            !array_key_exists('search', $filters)
            || $filters['search'] === null
            || trim($filters['search']) === ''
        ) {
            return;
        }

        $search = trim($filters['search']);

        $query->where(function (Builder $query) use ($search) {
            $query
                ->whereHas(
                    'user',
                    function (Builder $userQuery) use ($search) {
                        $userQuery->where(
                            'fullname',
                            'like',
                            "%{$search}%"
                        );
                    }
                )
                ->orWhere(
                    'player_name',
                    'like',
                    "%{$search}%"
                );
        });
    }

    /**
     * Filter paid cho danh sách players.
     */
    protected function applyPlayerPaidFilter(
        Builder $query,
        array $filters
    ): void {
        if (
            !array_key_exists('paid', $filters)
            || $filters['paid'] === null
            || $filters['paid'] === ''
        ) {
            return;
        }

        $query->where(
            'paid',
            filter_var(
                $filters['paid'],
                FILTER_VALIDATE_BOOLEAN
            )
        );
    }

    /**
     * Sorting danh sách players.
     *
     * Mặc định:
     * session_date DESC
     *
     * Vì session_date nằm ở exchange_sessions,
     * sử dụng subquery thay vì JOIN.
     */
    protected function applyPlayerSorting(
        Builder $query,
        array $filters
    ): void {
        $sortBy = $filters['sort_by'] ?? 'session_date';
        $sortDir = $filters['sort_dir'] ?? 'desc';

        /*
        |--------------------------------------------------------------------------
        | Validate direction
        |--------------------------------------------------------------------------
        */
        if (!in_array($sortDir, ['asc', 'desc'], true)) {
            $sortDir = 'desc';
        }

        /*
        |--------------------------------------------------------------------------
        | Sort theo ngày buổi giao lưu
        |--------------------------------------------------------------------------
        */
        if ($sortBy === 'session_date') {
            $query->orderBy(
                ExchangeSession::select('session_date')
                    ->whereColumn(
                        'exchange_sessions.id',
                        'exchange_session_players.exchange_session_id'
                    ),
                $sortDir
            );

            $query->orderBy(
                'sort_order',
                'asc'
            );

            $query->orderBy(
                'id',
                'asc'
            );

            return;
        }

        /*
        |--------------------------------------------------------------------------
        | Sort field của exchange_session_players
        |--------------------------------------------------------------------------
        */
        $allowedColumns = [
            'id',
            'amount',
            'paid',
            'sort_order',
            'created_at',
        ];

        if (!in_array($sortBy, $allowedColumns, true)) {
            $sortBy = $this->defaultOrderBy;
            $sortDir = $this->defaultOrderDirection;
        }

        $query
            ->orderBy(
                $sortBy,
                $sortDir
            )
            ->orderBy(
                'id',
                'asc'
            );
    }
}

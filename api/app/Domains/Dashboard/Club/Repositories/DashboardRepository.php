<?php

namespace App\Domains\Dashboard\Club\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\ClubMember;
use App\Domains\ExchangeSession\Models\ExchangeSession;
use App\Domains\ExchangeSession\Models\ExchangeSessionPlayer;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\User\Models\User;
use Illuminate\Pagination\LengthAwarePaginator;

class DashboardRepository extends BaseRepository
{
    protected ClubMember $clubMemberModel;

    protected FundPeriod $fundPeriodModel;

    protected MonthlyContribution $monthlyContributionModel;

    protected ExchangeSession $exchangeSessionModel;

    protected ExchangeSessionPlayer $exchangeSessionPlayerModel;

    protected Transaction $transactionModel;

    public function __construct(
        ClubMember $clubMemberModel,
        FundPeriod $fundPeriodModel,
        MonthlyContribution $monthlyContributionModel,
        ExchangeSession $exchangeSessionModel,
        ExchangeSessionPlayer $exchangeSessionPlayerModel,
        Transaction $transactionModel,
    ) {
        $this->clubMemberModel = $clubMemberModel;
        $this->fundPeriodModel = $fundPeriodModel;
        $this->monthlyContributionModel = $monthlyContributionModel;
        $this->exchangeSessionModel = $exchangeSessionModel;
        $this->exchangeSessionPlayerModel = $exchangeSessionPlayerModel;
        $this->transactionModel = $transactionModel;
    }

    /**
     * Thống kê member của Dashboard Club.
     *
     * total:
     * - Tất cả club members chưa bị soft delete.
     *
     * active:
     * - club_member.status = approved
     * - club_member.is_active = true
     * - user.status = active
     *
     * inactive:
     * - club_member.status = approved
     * - user.status = pending hoặc locked
     *
     * pending_members:
     * - club_member.status = pending
     *
     * rejected_members:
     * - club_member.status = rejected
     *
     * removed_members:
     * - club_member.status = removed
     *
     * new_members:
     * - club_member.joined_at nằm trong date_from/date_to
     */
    public function memberStats(array $filters = []): array
    {
        $query = $this->clubMemberModel
            ->newQuery()
            ->join(
                'users',
                'users.id',
                '=',
                'club_members.user_id'
            )
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where(
                    'club_members.club_id',
                    (int) $filters['club_id']
                )
            );

        $result = $query
            ->selectRaw('COUNT(*) AS total')

            ->selectRaw(
                '
                SUM(
                    CASE
                        WHEN club_members.status = ?
                            AND club_members.is_active = 1
                            AND users.status = ?
                        THEN 1
                        ELSE 0
                    END
                ) AS active
                ',
                [
                    ClubMember::STATUS_APPROVED,
                    User::STATUS_ACTIVE,
                ]
            )

            ->selectRaw(
                '
                SUM(
                    CASE
                        WHEN club_members.status = ?
                            AND users.status IN (?, ?)
                        THEN 1
                        ELSE 0
                    END
                ) AS inactive
                ',
                [
                    ClubMember::STATUS_APPROVED,
                    User::STATUS_PENDING,
                    User::STATUS_LOCKED,
                ]
            )

            ->selectRaw(
                '
                SUM(
                    CASE
                        WHEN club_members.status = ?
                        THEN 1
                        ELSE 0
                    END
                ) AS pending_members
                ',
                [
                    ClubMember::STATUS_PENDING,
                ]
            )

            ->selectRaw(
                '
                SUM(
                    CASE
                        WHEN club_members.status = ?
                        THEN 1
                        ELSE 0
                    END
                ) AS rejected_members
                ',
                [
                    ClubMember::STATUS_REJECTED,
                ]
            )

            ->selectRaw(
                '
                SUM(
                    CASE
                        WHEN club_members.status = ?
                        THEN 1
                        ELSE 0
                    END
                ) AS removed_members
                ',
                [
                    ClubMember::STATUS_REMOVED,
                ]
            )

            ->selectRaw(
                '
                SUM(
                    CASE
                        WHEN club_members.joined_at >= ?
                            AND club_members.joined_at <= ?
                        THEN 1
                        ELSE 0
                    END
                ) AS new_members
                ',
                [
                    $filters['date_from'],
                    $filters['date_to'],
                ]
            )
            ->first();

        return [
            'total' => (int) $result->total,
            'active' => (int) $result->active,
            'inactive' => (int) $result->inactive,
            'pending_members' => (int) $result->pending_members,
            'rejected_members' => (int) $result->rejected_members,
            'removed_members' => (int) $result->removed_members,
            'new_members' => (int) $result->new_members,
        ];
    }

    /**
     * Dashboard Fund Periods.
     *
     * FundPeriod là dữ liệu theo tháng nên lấy theo year/month
     * được resolve từ date_from.
     */
    public function fundPeriods(array $filters = [])
    {
        $dateFrom = $filters['date_from'];

        return $this->fundPeriodModel
            ->newQuery()
            ->select([
                'id',
                'club_id',
                'year',
                'month',
                'male_amount',
                'female_amount',
                'exchange_male_amount',
                'exchange_female_amount',
                'is_active',
                'is_locked',
            ])
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where(
                    'club_id',
                    (int) $filters['club_id']
                )
            )
            ->where('year', $dateFrom->year)
            ->where('month', $dateFrom->month)
            ->orderByDesc('year')
            ->orderByDesc('month')
            ->get();
    }

    /**
     * Dashboard Contributions.
     *
     * Tìm FundPeriod có year/month nằm trong date_from/date_to,
     * rồi lấy contributions cho các period đó.
     */
    public function contributions(array $filters = []): LengthAwarePaginator
    {
        return $this->monthlyContributionModel
            ->newQuery()
            ->select([
                'id',
                'club_id',
                'user_id',
                'period_id',
                'amount',
                'status',
            ])
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where(
                    'club_id',
                    (int) $filters['club_id']
                )
            )
            ->whereHas('period', function ($query) use ($filters) {
                $dateFrom = $filters['date_from'];
                $dateTo = $filters['date_to'];

                $query
                    ->where(function ($query) use ($dateFrom) {
                        $query
                            ->where('year', '>', $dateFrom->year)
                            ->orWhere(function ($query) use ($dateFrom) {
                                $query
                                    ->where('year', $dateFrom->year)
                                    ->where('month', '>=', $dateFrom->month);
                            });
                    })
                    ->where(function ($query) use ($dateTo) {
                        $query
                            ->where('year', '<', $dateTo->year)
                            ->orWhere(function ($query) use ($dateTo) {
                                $query
                                    ->where('year', $dateTo->year)
                                    ->where('month', '<=', $dateTo->month);
                            });
                    });
            })
            ->with([
                'user:id,fullname',
                'period:id,year,month',
            ])
            ->orderByDesc('id')
            ->paginate(
                $filters['limit'] ?? 15,
                ['*'],
                'page',
                $filters['page'] ?? 1
            );
    }

    /**
     * Dashboard Sessions.
     *
     * Lấy exchange sessions theo session_date trong date range.
     */
    public function sessions(array $filters = []): LengthAwarePaginator
    {
        return $this->exchangeSessionModel
            ->newQuery()
            ->select([
                'id',
                'club_id',
                'session_date',
                'court_name',
                'court_address',
                'start_time',
                'end_time',
                'status',
                'type',
                'player_count',
                'total_amount',
                'amount_per_player',
            ])
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where('club_id', (int) $filters['club_id'])
            )
            ->whereBetween('session_date', [
                $filters['date_from']->toDateString(),
                $filters['date_to']->toDateString(),
            ])
            ->orderByDesc('session_date')
            ->orderByDesc('start_time')
            ->paginate(
                $filters['limit'] ?? 15,
                ['*'],
                'page',
                $filters['page'] ?? 1
            );
    }

    /**
     * Dashboard Transactions.
     *
     * Lấy transactions theo transaction_date trong date range.
     */
    public function transactions(array $filters = []): LengthAwarePaginator
    {
        return $this->transactionModel
            ->newQuery()
            ->select([
                'id',
                'club_id',
                'source',
                'type',
                'amount',
                'description',
                'reference_code',
                'sender_name',
                'transaction_date',
            ])
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where('club_id', (int) $filters['club_id'])
            )
            ->whereBetween('transaction_date', [
                $filters['date_from'],
                $filters['date_to'],
            ])
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->paginate(
                $filters['limit'] ?? 15,
                ['*'],
                'page',
                $filters['page'] ?? 1
            );
    }

    /**
     * Dashboard Cash Flow.
     *
     * Aggregate transactions theo ngày: income, expense, net.
     */
    public function cashFlow(array $filters = []): array
    {
        $rows = $this->transactionModel
            ->newQuery()
            ->selectRaw('DATE(transaction_date) AS date')
            ->selectRaw("
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS income
            ")
            ->selectRaw("
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expense
            ")
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where('club_id', (int) $filters['club_id'])
            )
            ->whereBetween('transaction_date', [
                $filters['date_from'],
                $filters['date_to'],
            ])
            ->groupByRaw('DATE(transaction_date)')
            ->orderBy('date')
            ->get();

        return $rows->map(fn($row) => [
            'date' => $row->date,
            'label' => \Carbon\Carbon::parse($row->date)->format('d/m'),
            'income' => (float) $row->income,
            'expense' => (float) $row->expense,
            'net' => (float) ($row->income - $row->expense),
        ])->values()->toArray();
    }

    /**
     * Dashboard Activity.
     *
     * Aggregate exchange_session_players theo session_date:
     * male, female, groups (số buổi), total.
     */
    public function activity(array $filters = []): array
    {
        $rows = $this->exchangeSessionPlayerModel
            ->newQuery()
            ->join(
                'exchange_sessions',
                'exchange_sessions.id',
                '=',
                'exchange_session_players.exchange_session_id'
            )
            ->selectRaw(
                'exchange_sessions.session_date AS date'
            )
            ->selectRaw(
                'SUM(exchange_session_players.male) AS male'
            )
            ->selectRaw(
                'SUM(exchange_session_players.female) AS female'
            )
            ->selectRaw(
                'COUNT(DISTINCT exchange_session_players.exchange_session_id) AS group_count'
            )
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where(
                    'exchange_sessions.club_id',
                    (int) $filters['club_id']
                )
            )
            ->whereBetween(
                'exchange_sessions.session_date',
                [
                    $filters['date_from']->toDateString(),
                    $filters['date_to']->toDateString(),
                ]
            )
            ->whereNull('exchange_sessions.deleted_at')
            ->groupBy('exchange_sessions.session_date')
            ->orderBy('date')
            ->get();

        return $rows->map(fn($row) => [
            'date' => $row->date,
            'label' => \Carbon\Carbon::parse($row->date)->format('d/m'),
            'male' => (int) $row->male,
            'female' => (int) $row->female,
            'groups' => (int) $row->group_count,
            'total' => (int) $row->male + (int) $row->female,
        ])->values()->toArray();
    }
}

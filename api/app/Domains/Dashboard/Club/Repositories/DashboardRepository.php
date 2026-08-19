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
use Carbon\Carbon;
use Carbon\CarbonPeriod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

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
        $dateTo = $filters['date_to'];

        $periods = $this->fundPeriodModel
            ->newQuery()
            ->select([
                'fund_periods.id as period_id',
                'fund_periods.year',
                'fund_periods.month',
                'male_amount',
                'female_amount',
                'exchange_male_amount',
                'exchange_female_amount',
                'fund_periods.is_active',
                'fund_periods.is_locked',
            ])
            ->selectRaw("COALESCE(SUM(CASE WHEN monthly_contributions.status IN ('paid', 'pending') THEN monthly_contributions.amount ELSE 0 END), 0) AS total_expected")
            ->selectRaw("COALESCE(SUM(CASE WHEN monthly_contributions.status = 'paid' THEN monthly_contributions.amount ELSE 0 END), 0) AS total_paid")
            ->selectRaw("COALESCE(SUM(CASE WHEN monthly_contributions.status = 'pending' THEN monthly_contributions.amount ELSE 0 END), 0) AS total_pending")
            ->selectRaw("SUM(CASE WHEN monthly_contributions.status = 'paid' THEN 1 ELSE 0 END) AS paid_count")
            ->selectRaw("SUM(CASE WHEN monthly_contributions.status = 'pending' THEN 1 ELSE 0 END) AS pending_count")
            ->leftJoin('monthly_contributions', function ($join) {
                $join->on('monthly_contributions.period_id', '=', 'fund_periods.id')
                    ->whereNull('monthly_contributions.deleted_at');
            })
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where(
                    'fund_periods.club_id',
                    (int) $filters['club_id']
                )
            )
            ->where(function ($query) use ($dateFrom, $dateTo) {
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
            ->groupBy([
                'fund_periods.id', 'fund_periods.year', 'fund_periods.month',
                'male_amount', 'female_amount', 'exchange_male_amount',
                'exchange_female_amount', 'fund_periods.is_active', 'fund_periods.is_locked',
            ])
            ->orderByDesc('fund_periods.year')
            ->orderByDesc('fund_periods.month')
            ->get();

        return $periods;
    }

    public function fundBalance(array $filters = []): array
    {
        $balance = DB::table('club_funds')
            ->where('club_id', (int) ($filters['club_id'] ?? 0))
            ->value('balance');

        return ['balance' => (float) ($balance ?? 0)];
    }

    /**
     * Dashboard Contributions.
     *
     * Tìm FundPeriod có year/month nằm trong date_from/date_to,
     * rồi lấy contributions cho các period đó.
     */
    public function contributions(array $filters = []): array
    {
        $query = $this->contributionQuery($filters);

        $summary = (clone $query)
            ->selectRaw('COUNT(*) AS total')
            ->selectRaw("SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) AS paid")
            ->selectRaw("SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending")
            ->selectRaw("SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled")
            ->selectRaw("COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS total_amount")
            ->first();

        $items = (clone $query)
            ->select([
                'id',
                'club_id',
                'user_id',
                'period_id',
                'amount',
                'status',
            ])
            ->with([
                'user:id,fullname',
                'period:id,year,month',
            ])
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        return [
            'summary' => [
                'total' => (int) $summary->total,
                'paid' => (int) $summary->paid,
                'pending' => (int) $summary->pending,
                'cancelled' => (int) $summary->cancelled,
                'total_amount' => (float) $summary->total_amount,
            ],
            'items' => $items,
        ];
    }

    private function contributionQuery(array $filters): Builder
    {
        return $this->monthlyContributionModel
            ->newQuery()
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
            });
    }

    /**
     * Dashboard Sessions.
     *
     * Lấy exchange sessions theo session_date trong date range.
     */
    public function sessions(array $filters = []): array
    {
        $query = $this->exchangeSessionModel
            ->newQuery()
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where('club_id', (int) $filters['club_id'])
            )
            ->whereBetween('session_date', [
                $filters['date_from']->toDateString(),
                $filters['date_to']->toDateString(),
            ]);

        $summary = (clone $query)
            ->selectRaw('COUNT(*) AS total')
            ->selectRaw("SUM(CASE WHEN status = 'upcoming' THEN 1 ELSE 0 END) AS upcoming")
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed")
            ->first();

        $items = (clone $query)
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
            ->orderByDesc('session_date')
            ->orderByDesc('start_time')
            ->limit(5)
            ->get();

        return [
            'summary' => [
                'total' => (int) $summary->total,
                'upcoming' => (int) $summary->upcoming,
                'completed' => (int) $summary->completed,
            ],
            'items' => $items,
        ];
    }

    /**
     * Dashboard Transactions.
     *
     * Lấy transactions theo transaction_date trong date range.
     */
    public function transactions(array $filters = []): array
    {
        $query = $this->transactionModel
            ->newQuery()
            ->when(
                !empty($filters['club_id']),
                fn($query) => $query->where('club_id', (int) $filters['club_id'])
            )
            ->whereBetween('transaction_date', [
                $filters['date_from'],
                $filters['date_to'],
            ]);

        $summary = (clone $query)
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income")
            ->selectRaw("COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense")
            ->first();

        $items = (clone $query)
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
            ->orderByDesc('transaction_date')
            ->orderByDesc('id')
            ->limit(5)
            ->get();

        $income = (float) $summary->income;
        $expense = (float) $summary->expense;

        return [
            'summary' => [
                'income' => $income,
                'expense' => $expense,
                'balance' => $income - $expense,
            ],
            'items' => $items,
        ];
    }

    /**
     * Dashboard Cash Flow.
     *
     * Aggregate transactions theo granularity: income, expense, net.
     */
    public function cashFlow(array $filters = []): array
    {
        $granularity = $filters['granularity'] ?? 'month';
        $dateExpression = $granularity === 'day'
            ? 'DATE(transaction_date)'
            : "DATE_FORMAT(transaction_date, '%Y-%m-01')";

        $rows = $this->transactionModel
            ->newQuery()
            ->selectRaw("{$dateExpression} AS date")
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
            ->groupByRaw($dateExpression)
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        return $this->timeline($filters, function (Carbon $date) use ($rows, $granularity): array {
            $key = $date->format('Y-m-d');
            $row = $rows->get($key);
            $income = (float) ($row->income ?? 0);
            $expense = (float) ($row->expense ?? 0);

            return [
                'key' => $granularity,
                'date' => $key,
                'label' => $date->format($granularity === 'day' ? 'd/m' : 'm/Y'),
                'income' => $income,
                'expense' => $expense,
                'net' => $income - $expense,
            ];
        });
    }

    /**
     * Dashboard Activity.
     *
     * Aggregate exchange_session_players theo session_date:
     * male, female, groups (số nhóm giao lưu), total.
     */
    public function activity(array $filters = []): array
    {
        $granularity = $filters['granularity'] ?? 'month';
        $dateExpression = $granularity === 'day'
            ? 'exchange_sessions.session_date'
            : "DATE_FORMAT(exchange_sessions.session_date, '%Y-%m-01')";

        $rows = $this->exchangeSessionPlayerModel
            ->newQuery()
            ->join(
                'exchange_sessions',
                'exchange_sessions.id',
                '=',
                'exchange_session_players.exchange_session_id'
            )
            ->selectRaw(
                "{$dateExpression} AS date"
            )
            ->selectRaw(
                'SUM(exchange_session_players.male) AS male'
            )
            ->selectRaw(
                'SUM(exchange_session_players.female) AS female'
            )
            ->selectRaw(
                'COUNT(exchange_session_players.id) AS group_count'
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
            ->whereNull('exchange_session_players.deleted_at')
            ->groupByRaw($dateExpression)
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        return $this->timeline($filters, function (Carbon $date) use ($rows, $granularity): array {
            $key = $date->format('Y-m-d');
            $row = $rows->get($key);
            $male = (int) ($row->male ?? 0);
            $female = (int) ($row->female ?? 0);

            return [
                'key' => $granularity,
                'date' => $key,
                'label' => $date->format($granularity === 'day' ? 'd/m' : 'm/Y'),
                'male' => $male,
                'female' => $female,
                'groups' => (int) ($row->group_count ?? 0),
                'total' => $male + $female,
            ];
        });
    }

    private function timeline(array $filters, callable $map): array
    {
        $granularity = $filters['granularity'] ?? 'month';
        $start = $filters['date_from']->copy();
        $end = $filters['date_to']->copy();

        if ($granularity === 'day') {
            $start->startOfDay();
            $end->startOfDay();
            $period = CarbonPeriod::create($start, '1 day', $end);
        } else {
            $start->startOfMonth();
            $end->startOfMonth();
            $period = CarbonPeriod::create($start, '1 month', $end);
        }

        return collect($period)
            ->map(fn(Carbon $date) => $map($date))
            ->values()
            ->toArray();
    }
}

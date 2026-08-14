<?php

namespace App\Domains\MonthlyContribution\Repositories;

use App\Base\BaseRepository;
use App\Domains\Club\Models\ClubMember;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

class MonthlyContributionRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'created_at';
    protected string $defaultOrderDirection = 'desc';

    protected array $allowedSortColumns = ['id', 'amount', 'payment_date', 'sort_order', 'created_at'];

    protected array $selectColumns = ['id', 'club_id', 'period_id', 'user_id', 'amount', 'status', 'is_active'];
    protected array $selectWith    = ['user:id,name,email', 'period:id,year,month'];

    public function __construct(MonthlyContribution $model)
    {
        parent::__construct($model);
    }

    public function findExistingForMemberPeriod(
        int $clubId,
        int $userId,
        int $periodId,
    ): ?MonthlyContribution {
        return MonthlyContribution::withTrashed()
            ->where('club_id', $clubId)
            ->where('user_id', $userId)
            ->where('period_id', $periodId)
            ->lockForUpdate()
            ->first();
    }

    // ── Hook overrides ───────────────────────────────────────────────────────

    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'user_id',
                'period_id',
                'transaction_id',
                'amount',
                'status',
                'paid_by',
                'payment_date',
                'sort_order',
                'is_active',
                'created_at',
            ])
            ->with([
                'user:id,fullname,email,gender',
                'period:id,year,month,male_amount,female_amount,exchange_male_amount,exchange_female_amount',
                'transaction:id,source,type,amount,reference_code,transaction_date',
                'paymentCode:id,monthly_contribution_id,payment_code,status,expired_at,used_at',
            ]);
    }

    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->whereHas(
                    'user',
                    fn($u) => $u
                        ->where('fullname', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                );
            });
        }
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (!empty($filters['club_id'])) {
            $query->where('club_id', (int) $filters['club_id']);
        }

        if (!empty($filters['period_id'])) {
            $query->where('period_id', (int) $filters['period_id']);
        }

        if (!empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['paid_by'])) {
            $query->where('paid_by', $filters['paid_by']);
        }
    }

    // ── Generate helpers ─────────────────────────────────────────────────────

    /**
     * Lấy tất cả member approved + is_active của club, kèm gender từ users.
     */
    public function getApprovedMembers(int $clubId)
    {
        return DB::table('club_members')
            ->where('club_id', $clubId)
            ->where('club_members.status', ClubMember::STATUS_APPROVED)
            ->where('club_members.is_active', true)
            ->join('users', 'users.id', '=', 'club_members.user_id')
            ->select('club_members.user_id', 'users.gender')
            ->get()
            ->map(fn($row) => (object) [
                'user_id' => $row->user_id,
                'user'    => (object) ['gender' => $row->gender],
            ]);
    }

    /**
     * Bulk insert, bỏ qua bản ghi đã tồn tại (unique period_id + user_id).
     * Trả về số bản ghi thực sự được tạo.
     */
    public function bulkInsertIgnoreDuplicates(array $rows): int
    {
        if (empty($rows)) {
            return 0;
        }

        $countBefore = MonthlyContribution::withTrashed()
            ->whereIn('user_id', array_column($rows, 'user_id'))
            ->where('period_id', $rows[0]['period_id'])
            ->count();

        // insertOrIgnore bỏ qua duplicate key violation thay vì throw exception
        MonthlyContribution::insertOrIgnore($rows);

        $countAfter = MonthlyContribution::withTrashed()
            ->whereIn('user_id', array_column($rows, 'user_id'))
            ->where('period_id', $rows[0]['period_id'])
            ->count();

        return $countAfter - $countBefore;
    }
}

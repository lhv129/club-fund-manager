<?php

namespace App\Domains\MemberPaymentCode\Repositories;

use App\Base\BaseRepository;
use App\Domains\MemberPaymentCode\Models\MemberPaymentCode;
use Illuminate\Database\Eloquent\Builder;

class MemberPaymentCodeRepository extends BaseRepository
{
    /** Payment code mặc định sort theo created_at desc (code mới nhất trước) */
    protected string $defaultOrderBy        = 'created_at';
    protected string $defaultOrderDirection = 'desc';

    protected array $allowedSortColumns = ['status', 'expired_at', 'created_at'];

    protected array $selectColumns = ['id', 'monthly_contribution_id', 'payment_code', 'status', 'expired_at', 'used_at'];
    protected array $selectWith    = ['monthlyContribution:id,period_id,user_id,amount,status'];

    public function __construct(MemberPaymentCode $model)
    {
        parent::__construct($model);
    }

    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'monthly_contribution_id',
                'payment_code',
                'status',
                'expired_at',
                'used_at',
                'is_active',
                'created_at',
            ])
            ->with([
                'monthlyContribution:id,period_id,user_id,amount,status',
                'monthlyContribution.user:id,fullname',
                'monthlyContribution.period:id,year,month'
            ]);
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (!empty($filters['monthly_contribution_id'])) {
            $query->where('monthly_contribution_id', (int) $filters['monthly_contribution_id']);
        }

        $this->applyStatusFilter($query, $filters, 'status', ['pending', 'used', 'expired']);
    }

    /**
     * Kiểm tra payment_code đã tồn tại (unique).
     */
    public function codeExists(string $code): bool
    {
        return $this->model
            ->where('payment_code', $code)
            ->exists();
    }

    /**
     * Tìm payment code pending + chưa hết hạn theo code string.
     * lockForUpdate() tránh race condition khi webhook đến nhiều lần cùng lúc.
     */
    public function findPendingByCode(
        string $code
    ): ?MemberPaymentCode {
        return $this->model
            ->where(
                'payment_code',
                strtoupper($code)
            )
            ->where('status', 'pending')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expired_at')
                    ->orWhere(
                        'expired_at',
                        '>=',
                        now()
                    );
            })
            ->with('monthlyContribution')
            ->lockForUpdate()
            ->first();
    }

    /**
     * Lấy code đang pending (chưa hết hạn) của 1 contribution.
     */
    public function findActiveForContribution(
        int $contributionId
    ): ?MemberPaymentCode {
        return $this->model
            ->where(
                'monthly_contribution_id',
                $contributionId
            )
            ->where('status', 'pending')
            ->where('is_active', true)
            ->where(function ($q) {
                $q->whereNull('expired_at')
                    ->orWhere(
                        'expired_at',
                        '>=',
                        now()
                    );
            })
            ->latest('id')
            ->first();
    }


    /**
     * Lấy code theo mã thanh toán.
     */
    public function findByPaymentCode(string $code)
    {
        return $this->model
            ->select([
                'id',
                'monthly_contribution_id',
                'payment_code',
                'status',
                'expired_at',
                'used_at',
                'is_active',
                'created_at',
                'updated_at',
            ])
            ->with([
                'monthlyContribution:id,period_id,user_id,paid_by,amount,status,payment_date',
                'monthlyContribution.user:id,fullname,email,gender',
                'monthlyContribution.period:id,year,month,male_amount,female_amount',
            ])
            ->where(
                'payment_code',
                strtoupper($code)
            )
            ->first();
    }
}

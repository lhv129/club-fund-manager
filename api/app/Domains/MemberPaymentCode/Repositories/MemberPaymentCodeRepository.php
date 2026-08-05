<?php

namespace App\Domains\MemberPaymentCode\Repositories;

use App\Base\BaseRepository;
use App\Domains\MemberPaymentCode\Models\MemberPaymentCode;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class MemberPaymentCodeRepository extends BaseRepository
{
    /** Payment code mặc định sort theo created_at desc (code mới nhất trước) */
    protected string $defaultOrderBy        = 'created_at';
    protected string $defaultOrderDirection = 'desc';

    protected array $allowedSortColumns = ['id', 'status', 'expired_at', 'created_at'];

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
                'sort_order',
                'created_at',
            ])
            ->with(['monthlyContribution:id,period_id,user_id,amount,status']);
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (!empty($filters['monthly_contribution_id'])) {
            $query->where('monthly_contribution_id', (int) $filters['monthly_contribution_id']);
        }

        $this->applyStatusFilter($query, $filters, 'status', ['pending', 'used', 'expired']);
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

    /**
     * Lấy code đang pending (chưa hết hạn) của 1 contribution.
     */
    public function findActiveForContribution(int $contributionId): ?MemberPaymentCode
    {
        return $this->model
            ->where('monthly_contribution_id', $contributionId)
            ->where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('expired_at')->orWhere('expired_at', '>=', now());
            })
            ->latest('id')
            ->first();
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
}

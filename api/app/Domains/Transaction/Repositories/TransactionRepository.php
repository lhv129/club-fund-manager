<?php

namespace App\Domains\Transaction\Repositories;

use App\Base\BaseRepository;
use App\Domains\Transaction\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class TransactionRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'transaction_date';

    protected string $defaultOrderDirection = 'desc';

    /** Whitelist cột sort */
    protected array $allowedSortColumns = [
        'id',
        'transaction_date',
        'amount',
        'balance',
        'type',
        'sort_order',
        'created_at',
    ];

    /** Cột cho getForSelect() */
    protected array $selectColumns = [
        'id',
        'source',
        'type',
        'amount',
        'description',
        'transaction_date',
        'created_at',
    ];

    protected array $selectWith = [];

    /** Khởi tạo repository với model giao dịch quỹ. */
    public function __construct(Transaction $model)
    {
        parent::__construct($model);
    }

    /** Query cơ sở cho danh sách, eager load quan hệ cần render. */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'bank_account_id',
                'webhook_config_id',
                'source',
                'type',
                'amount',
                'balance',
                'description',
                'reference_code',
                'sender_name',
                'sender_account',
                'transaction_date',
                'is_active',
                'sort_order',
                'created_at',
                'updated_at',
            ])
            ->with([
                'bankAccount:id,account_number,account_name,bank_id',
                'bankAccount.bank:id,code,name,short_name,logo',
                'webhookConfig:id,type',
            ]);
    }

    /** Search theo description hoặc reference_code. */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('reference_code', 'like', "%{$search}%")
                    ->orWhere('sender_name', 'like', "%{$search}%");
            });
        }
    }

    /** Filter đặc thù Transaction. */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (! empty($filters['club_id'])) {
            $query->where('club_id', (int) $filters['club_id']);
        }

        if (! empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        if (! empty($filters['bank_account_id'])) {
            $query->where('bank_account_id', (int) $filters['bank_account_id']);
        }

        if (! empty($filters['type']) && in_array($filters['type'], ['income', 'expense'], true)) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['from_date'])) {
            $query->whereDate('transaction_date', '>=', $filters['from_date']);
        }

        if (! empty($filters['to_date'])) {
            $query->whereDate('transaction_date', '<=', $filters['to_date']);
        }
    }

    /** Tìm chi tiết giao dịch trong phạm vi club và eager-load ngân hàng. */
    public function findDetail(int $id, ?int $clubId = null): ?Transaction
    {
        $query = $this->model
            ->with([
                'bankAccount:id,account_number,account_name,bank_id',
                'bankAccount.bank:id,code,name,short_name,logo',
                'webhookConfig:id,type',
            ]);

        if ($clubId !== null) {
            $query->where('club_id', $clubId);
        }

        return $query->find($id);
    }

    /** Tìm giao dịch theo ID và bắt buộc thuộc đúng club. */
    public function findForClub(int $id, int $clubId): ?Transaction
    {
        return $this->model
            ->newQuery()
            ->where('club_id', $clubId)
            ->find($id);
    }

    /** Khóa một transaction theo ID trong phạm vi club. */
    public function lockByIdForClub(int $id, int $clubId): Transaction
    {
        return $this->model
            ->newQuery()
            ->where('club_id', $clubId)
            ->lockForUpdate()
            ->findOrFail($id);
    }

    /**
     * Khóa ledger của club theo id tăng dần để tái tính balance snapshots.
     * Soft-deleted rows bị loại bởi global scope của model.
     */
    public function lockLedgerForClub(int $clubId): Collection
    {
        return $this->model
            ->newQuery()
            ->select([
                'id',
                'club_id',
                'bank_account_id',
                'webhook_config_id',
                'source',
                'type',
                'amount',
                'balance',
                'description',
                'reference_code',
                'sender_name',
                'sender_account',
                'transaction_date',
                'is_active',
                'sort_order',
                'created_at',
                'updated_at',
            ])
            ->where('club_id', $clubId)
            ->orderBy('id')
            ->lockForUpdate()
            ->get();
    }

    /**
     * Tìm transaction thu hợp lệ cho khoản đóng quỹ theo nguồn bank/cash.
     * Từ chối transaction đã được một nghiệp vụ khác tham chiếu.
     */
    public function findForContributionPayment(
        int $id,
        int $clubId,
        string $paidBy,
        ?int $ignoreContributionId = null,
    ): ?Transaction {
        $source = $paidBy === 'bank'
            ? Transaction::SOURCE_WEBHOOK
            : Transaction::SOURCE_CASH;

        $transaction = $this->model
            ->newQuery()
            ->whereKey($id)
            ->where('club_id', $clubId)
            ->where('type', Transaction::TYPE_INCOME)
            ->where('source', $source)
            ->where('is_active', true)
            ->lockForUpdate()
            ->first();

        if (! $transaction || $this->isReferenced($id, $ignoreContributionId)) {
            return null;
        }

        return $transaction;
    }

    /** Kiểm tra transaction đang được monthly contribution hoặc exchange session sử dụng. */
    public function isReferenced(int $id, ?int $ignoreContributionId = null): bool
    {
        $monthlyContributionQuery = DB::table('monthly_contributions')
            ->where('transaction_id', $id)
            ->whereNull('deleted_at');

        if ($ignoreContributionId !== null) {
            $monthlyContributionQuery->where('id', '!=', $ignoreContributionId);
        }

        if ($monthlyContributionQuery->exists()) {
            return true;
        }

        return DB::table('exchange_sessions')
            ->where('transaction_id', $id)
            ->whereNull('deleted_at')
            ->exists()
            || DB::table('exchange_session_players')
            ->where('transaction_id', $id)
            ->whereNull('deleted_at')
            ->exists();
    }

    /** Vô hiệu hóa rồi soft-delete transaction do hệ thống quản lý. */
    public function deactivateAndDelete(Transaction $transaction): void
    {
        $transaction->is_active = false;
        $transaction->save();
        $transaction->delete();
    }

    /** Nạp các quan hệ ngân hàng và webhook dùng cho response chi tiết. */
    public function loadDetailRelations(Transaction $transaction): Transaction
    {
        return $transaction->load([
            'bankAccount:id,account_number,account_name,bank_id',
            'bankAccount.bank:id,code,name,short_name,logo',
            'webhookConfig:id,type',
        ]);
    }
}

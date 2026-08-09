<?php

namespace App\Domains\Transaction\Repositories;

use App\Base\BaseRepository;
use App\Domains\Transaction\Models\Transaction;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class TransactionRepository extends BaseRepository
{
    // ------------------------------------------------------------------
    // Cấu hình — Base sử dụng trực tiếp
    // ------------------------------------------------------------------

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
        'description',
        'created_at'
    ];

    protected array $selectWith = [];

    public function __construct(Transaction $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Hook overrides
    // ------------------------------------------------------------------

    /**
     * Query cơ sở cho getList() / getCursorList().
     * Select cột cần thiết + eager load user để tránh N+1 khi render list.
     */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'bank_account_id',
                'webhook_config_id',
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

    /**
     * Search theo description hoặc reference_code.
     * (Không có cột title trên transactions — fix bug cũ.)
     */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('reference_code', 'like', "%{$search}%")
                    ->orWhere('sender_name', 'like', "%{$search}%");
            });
        }
    }

    /**
     * Filter đặc thù Transaction: is_active + user_id + type + bank_account_id
     * + khoảng ngày (from_date / to_date).
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (!empty($filters['user_id'])) {
            $query->where('user_id', (int) $filters['user_id']);
        }

        if (!empty($filters['bank_account_id'])) {
            $query->where('bank_account_id', (int) $filters['bank_account_id']);
        }

        if (!empty($filters['type']) && in_array($filters['type'], ['income', 'expense'], true)) {
            $query->where('type', $filters['type']);
        }

        if (!empty($filters['from_date'])) {
            $query->whereDate('transaction_date', '>=', $filters['from_date']);
        }

        if (!empty($filters['to_date'])) {
            $query->whereDate('transaction_date', '<=', $filters['to_date']);
        }
    }

    // ------------------------------------------------------------------
    // Domain-specific list methods
    // ------------------------------------------------------------------

    /**
     * Offset pagination (admin table).
     * Build từ baseListQuery() + hooks. Sort whitelist chặn cột lạ.
     */
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

    /**
     * Cursor pagination (infinite scroll).
     * Cursor phải orderBy cột unique → applyCursorOrder() mặc định đã có tie-breaker id desc.
     */
    public function getCursorList(array $filters = []): CursorPaginator
    {
        $query = $this->baseListQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);
        $this->applyCursorOrder($query);

        return $query->cursorPaginate($filters['limit'] ?? $this->defaultLimit);
    }

    /**
     * Dropdown — nhẹ, không phân trang, không Resource.
     * Chỉ trả id + title + slug, defaultOrderBy (sort_order asc).
     */
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

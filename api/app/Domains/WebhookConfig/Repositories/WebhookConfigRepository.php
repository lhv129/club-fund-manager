<?php

namespace App\Domains\WebhookConfig\Repositories;

use App\Base\BaseRepository;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use Illuminate\Database\Eloquent\Builder;

class WebhookConfigRepository extends BaseRepository
{
    // ------------------------------------------------------------------
    // Cấu hình — Base sử dụng trực tiếp
    // ------------------------------------------------------------------

    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    /** Whitelist cột sort cho getList() */
    protected array $allowedSortColumns = ['id', 'type', 'sort_order', 'created_at'];

    /** Cột cho getForSelect() — dropdown */
    protected array $selectColumns = ['id', 'type', 'is_active'];
    protected array $selectWith    = [];

    public function __construct(WebhookConfig $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Hook overrides
    // ------------------------------------------------------------------

    /**
     * Query cơ sở cho getList() / getCursorList().
     */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'bank_account_id',
                'type',
                'webhook_url',
                'is_verified',
                'is_active',
                'sort_order',
                'created_at',
            ])
            ->with(['bankAccount:id,club_id,bank_name,account_number,account_name']);
    }

    /**
     * Search theo webhook_url hoặc type.
     */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('webhook_url', 'like', "%{$search}%")
                    ->orWhere('type', 'like', "%{$search}%");
            });
        }
    }

    /**
     * Filter đặc thù WebhookConfig: is_active, type, is_verified, bank_account_id.
     * club_id luôn được filter từ controller (nested route).
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['is_verified']) && $filters['is_verified'] !== '' && $filters['is_verified'] !== null) {
            $query->where('is_verified', filter_var($filters['is_verified'], FILTER_VALIDATE_BOOLEAN));
        }

        if (!empty($filters['bank_account_id'])) {
            $query->where('bank_account_id', (int) $filters['bank_account_id']);
        }
    }

    /**
     * Tìm WebhookConfig đang active theo token trong URL.
     */
    public function findActiveConfigByToken(string $token): ?WebhookConfig
    {
        return $this->model->where('webhook_token', $token)
            ->where('is_active', true)
            ->first();
    }
}

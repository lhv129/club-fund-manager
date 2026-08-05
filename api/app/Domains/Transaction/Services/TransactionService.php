<?php

namespace App\Domains\Transaction\Services;

use App\Base\BaseService;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\Transaction\Repositories\TransactionRepository;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TransactionService extends BaseService
{
    protected string $notFoundMessage = 'domains/transaction.not_found';

    public function __construct(TransactionRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * GET /api/v1/transactions
     *   ?search=abc &is_active=1 &user_id=2 &sort_by=transaction_date &sort_dir=asc &limit=20 &page=1
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }


    public function createTransaction(
        WebhookConfig $config,
        array $payload
    ): Transaction {
        return $this->repository->create([
            'club_id' => $config->club_id,
            'bank_account_id' => $config->bank_account_id,
            'webhook_config_id' => $config->id,

            'source' => 'webhook',
            'type' => ($payload['transferType'] ?? 'in') === 'in'
                ? 'income'
                : 'expense',

            'amount' => $payload['transferAmount'],
            'balance' => $payload['accumulated'] ?? null,
            'description' => $payload['content'] ?? '',
            'reference_code' => $payload['referenceCode'] ?? null,
            'transaction_date' => $payload['transactionDate'],
            'raw_payload' => $payload,

            'sort_order' => 0,
            'is_active' => true,
        ]);
    }
}

<?php

namespace App\Domains\Transaction\Services;

use App\Base\BaseService;
use App\Domains\ClubFund\Services\ClubFundService;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\Transaction\Repositories\TransactionRepository;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use App\Exceptions\ApiException;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class TransactionService extends BaseService
{
    protected string $notFoundMessage = 'domains/transaction.not_found';

    public function __construct(
        TransactionRepository $repository,
        protected ClubFundService $clubFundService,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    // -------------------------------------------------------------------------
    // Select
    // -------------------------------------------------------------------------

    public function getForSelect(array $filters = [])
    {
        return $this->repository->getForSelect($filters);
    }

    // -------------------------------------------------------------------------
    // Detail
    // -------------------------------------------------------------------------

    public function findDetail(int $id, ?int $clubId = null): Transaction
    {
        $data = $this->repository->findDetail($id, $clubId);

        if (! $data) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $data;
    }

    // -------------------------------------------------------------------------
    // Webhook
    // -------------------------------------------------------------------------

    public function createTransaction(
        WebhookConfig $config,
        array $payload
    ): Transaction {
        return $this->clubFundService->recordTransaction([
            'club_id' => $config->club_id,
            'bank_account_id' => $config->bank_account_id,
            'webhook_config_id' => $config->id,

            'source' => 'webhook',
            'type' => ($payload['transferType'] ?? 'in') === 'in'
                ? 'income'
                : 'expense',

            'amount' => $payload['transferAmount'],
            'description' => $this->normalizeDescription($payload),
            'reference_code' => $payload['referenceCode'] ?? null,
            'transaction_date' => $payload['transactionDate'],
            'raw_payload' => $payload,

            'sort_order' => 0,
            'is_active' => true,
        ]);
    }

    /** Chuẩn hóa nội dung giao dịch từ SePay. */
    private function normalizeDescription(array $payload): string
    {
        $content = trim($payload['content'] ?? '');

        if ($content === '') {
            return '';
        }

        $prefixes = [
            'MBCT',
            'BankAPINotify',
            'IBFT',
            'NAPAS',
        ];

        foreach ($prefixes as $prefix) {
            $content = preg_replace(
                '/^' . preg_quote($prefix, '/') . '\s+/i',
                '',
                $content
            );
        }

        $content = preg_replace(
            '/\s+[A-Z0-9]{6,}\/\d+$/i',
            '',
            $content
        );

        $content = trim($content);

        if (preg_match('/^[A-Z0-9]{6,20}$/', $content)) {
            return $content;
        }

        return preg_replace('/\s+/', ' ', $content);
    }

    // -------------------------------------------------------------------------
    // Manual
    // -------------------------------------------------------------------------

    public function createManual(array $data): Transaction
    {
        return $this->clubFundService->recordTransaction([
            'club_id' => $data['club_id'],
            'bank_account_id' => $data['bank_account_id'] ?? null,
            'webhook_config_id' => null,

            'source' => $data['source'] ?? Transaction::SOURCE_MANUAL,
            'type' => $data['type'] ?? Transaction::TYPE_INCOME,

            'amount' => $data['amount'],
            'description' => $data['description'] ?? null,
            'reference_code' => $data['reference_code'] ?? null,

            'sender_name' => $data['sender_name'] ?? null,
            'sender_account' => $data['sender_account'] ?? null,

            'transaction_date' => ! empty($data['transaction_date'])
                ? Carbon::parse($data['transaction_date'])
                : now(),

            'sort_order' => 0,
            'is_active' => true,
        ]);
    }

    public function create(array $data): Transaction
    {
        return $this->createManual($data);
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------

    public function updateForClub(int $id, int $clubId, array $data): Transaction
    {
        $transaction = $this->repository->findForClub($id, $clubId);

        if (! $transaction) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        // Do not rely on Form Request as the source-level authorization boundary.
        // The service accepts only the explicitly supported update fields.
        $allowedFields = [
            'description',
            'type',
            'amount',
            'transaction_date',
            'bank_account_id',
        ];
        $updates = array_intersect_key($data, array_fill_keys($allowedFields, true));

        $financialFields = [
            'type',
            'amount',
            'transaction_date',
            'bank_account_id',
        ];
        $hasFinancialUpdate = array_intersect(
            $financialFields,
            array_keys($updates),
        ) !== [];

        if ($hasFinancialUpdate && ! in_array(
            $transaction->source,
            [Transaction::SOURCE_CASH, Transaction::SOURCE_MANUAL],
            true,
        )) {
            throw new ApiException(
                __('domains/transaction.financial_fields_immutable'),
                422,
                'WEBHOOK_TRANSACTION_IMMUTABLE',
            );
        }

        if ($hasFinancialUpdate) {
            return $this->clubFundService->updateManagedTransaction(
                $id,
                $clubId,
                $updates,
            );
        }

        // array_key_exists preserves an explicit null so description can be cleared.
        if (! array_key_exists('description', $updates)) {
            return $this->repository->loadDetailRelations($transaction);
        }

        return $this->repository->loadDetailRelations(
            $this->repository->update($transaction, [
                'description' => $updates['description'],
            ]),
        );
    }

    /** Internal lifecycle hook. The public Transactions API has no DELETE route. */
    public function deleteForClub(int $id, int $clubId): void
    {
        $transaction = $this->repository->findForClub($id, $clubId);

        if (! $transaction) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        if ($transaction->source === Transaction::SOURCE_WEBHOOK) {
            throw new ApiException(
                __('domains/transaction.webhook_delete_forbidden'),
                422,
                'WEBHOOK_TRANSACTION_DELETE_FORBIDDEN',
            );
        }

        if ($this->repository->isReferenced($id)) {
            throw new ApiException(
                __('domains/transaction.in_use'),
                422,
                'TRANSACTION_IN_USE',
            );
        }

        $this->clubFundService->deleteManagedTransaction($id, $clubId);
    }
}

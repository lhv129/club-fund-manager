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
            // Nội dung đã được chuẩn hóa
            'description' => $this->normalizeDescription($payload),

            'reference_code' => $payload['referenceCode'] ?? null,
            'transaction_date' => $payload['transactionDate'],
            'raw_payload' => $payload,

            'sort_order' => 0,
            'is_active' => true,
        ]);
    }

    /**
     * Chuẩn hóa nội dung giao dịch từ SePay.
     */
    private function normalizeDescription(array $payload): string
    {
        $content = trim($payload['content'] ?? '');

        if ($content === '') {
            return '';
        }

        /**
         * Xóa các tiền tố do ngân hàng thêm.
         */
        $prefixes = [
            'MBCT',
            'BankAPINotify',
            'IBFT',
            'NAPAS',
        ];

        foreach ($prefixes as $prefix) {
            $content = preg_replace(
                '/^'.preg_quote($prefix, '/').'\s+/i',
                '',
                $content
            );
        }

        /**
         * Xóa hậu tố dạng:
         *
         * I2M7D1XN/679676
         * D2SBB3FH/764228
         * ABCDEF12/123456
         */
        $content = preg_replace(
            '/\s+[A-Z0-9]{6,}\/\d+$/i',
            '',
            $content
        );

        $content = trim($content);

        /**
         * Nếu sau khi bỏ hậu tố chỉ còn đúng 1 token
         * và token đó giống payment code
         * thì giữ nguyên.
         *
         * VD:
         * P3XCBX75
         */
        if (preg_match('/^[A-Z0-9]{6,20}$/', $content)) {
            return $content;
        }

        /**
         * Nếu là câu bình thường
         */
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
            'type' => Transaction::TYPE_INCOME,

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
        // Thu thủ công/cash đi qua cùng một luồng cập nhật quỹ.
        $data['type'] = 'income';

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

        if ($transaction->source === Transaction::SOURCE_WEBHOOK) {
            if (array_diff_key($data, ['description' => true]) !== []) {
                throw new ApiException(
                    __('domains/transaction.financial_fields_immutable'),
                    422,
                    'WEBHOOK_TRANSACTION_IMMUTABLE',
                );
            }

            return $this->repository->loadDetailRelations(
                $this->repository->update($transaction, $data),
            );
        }

        if (! in_array($transaction->source, [Transaction::SOURCE_CASH, Transaction::SOURCE_MANUAL], true)) {
            throw new ApiException(
                __('domains/transaction.financial_fields_immutable'),
                422,
                'TRANSACTION_IMMUTABLE',
            );
        }

        unset($data['source'], $data['type']);

        return $this->repository->loadDetailRelations(
            $this->clubFundService->updateManagedTransaction($id, $clubId, $data),
        );
    }

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

        if (! in_array($transaction->source, [Transaction::SOURCE_CASH, Transaction::SOURCE_MANUAL], true)) {
            throw new ApiException(
                __('domains/transaction.financial_fields_immutable'),
                422,
                'TRANSACTION_IMMUTABLE',
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

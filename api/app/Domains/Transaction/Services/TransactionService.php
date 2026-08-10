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
use Illuminate\Support\Facades\DB;

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
    public function findDetail(int $id): Transaction
    {
        $data = $this->repository->findDetail($id);

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
        return DB::transaction(function () use ($data) {

            return $this->clubFundService->recordTransaction([
                'club_id' => $data['club_id'],
                'bank_account_id' => $data['bank_account_id'] ?? null,
                'webhook_config_id' => null,

                'source' => $data['source'] ?? 'manual',
                'type' => $data['type'] ?? 'income',

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
        });
    }

    public function create(array $data): Transaction
    {
        // API manual đi qua cùng một luồng cập nhật quỹ.
        $data['type'] = 'income';

        return $this->createManual($data);
    }

    // -------------------------------------------------------------------------
    // Update
    // -------------------------------------------------------------------------

    public function updateDescription(int $id, array $data): Transaction
    {
        $transaction = $this->find($id);

        $transaction->description = $data['description'] ?? $transaction->description;

        $transaction->save();

        return $transaction->fresh([
            'bankAccount:id,account_number,account_name',
        ]);
    }
}

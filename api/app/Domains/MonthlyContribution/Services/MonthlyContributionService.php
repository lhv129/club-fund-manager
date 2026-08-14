<?php

namespace App\Domains\MonthlyContribution\Services;

use App\Base\BaseService;
use App\Domains\Club\Models\ClubMember;
use App\Domains\ClubFund\Services\ClubFundService;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\FundPeriod\Repositories\FundPeriodRepository;
use App\Domains\FundPeriod\Services\FundPeriodStateGuard;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\MonthlyContribution\Repositories\MonthlyContributionRepository;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\Transaction\Repositories\TransactionRepository;
use App\Domains\User\Repositories\UserRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MonthlyContributionService extends BaseService
{
    protected string $notFoundMessage =
        'domains/monthly_contribution.not_found';

    protected object $userRepository;

    protected object $fundPeriodRepository;

    public function __construct(
        MonthlyContributionRepository $repository,
        UserRepository $userRepository,
        FundPeriodRepository $fundPeriodRepository,
        protected FundPeriodStateGuard $periodStateGuard,
        protected TransactionRepository $transactionRepository,
        protected ClubFundService $clubFundService,
    ) {
        parent::__construct($repository);

        $this->userRepository = $userRepository;
        $this->fundPeriodRepository = $fundPeriodRepository;
    }

    // =========================================================================
    // LIST / SEARCH
    // =========================================================================

    public function paginate(
        array $filters = []
    ): LengthAwarePaginator {
        return $this->repository->getList($filters);
    }

    public function cursorPaginate(
        array $filters = []
    ): CursorPaginator {
        return $this->repository->getCursorList($filters);
    }

    public function getForSelect(
        array $filters = []
    ): Collection {
        return $this->repository->getForSelect($filters);
    }

    // =========================================================================
    // FIND
    // =========================================================================

    public function find(int $id, ?int $clubId = null): MonthlyContribution
    {
        $conditions = ['id' => $id];

        if ($clubId !== null) {
            $conditions['club_id'] = $clubId;
        }

        return $this->findByConditions($conditions);
    }

    public function findWithRelations(
        int $id,
        array $with = [],
        ?int $clubId = null,
    ): MonthlyContribution {
        $where = ['id' => $id];

        if ($clubId !== null) {
            $where['club_id'] = $clubId;
        }

        $contribution = $this->repository->first(
            where: $where,
            with: $with,
            select: ['*'],
        );

        if (! $contribution) {
            throw new ApiException(
                __($this->notFoundMessage),
                404
            );
        }

        return $contribution;
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    public function create(array $data): MonthlyContribution
    {
        return DB::transaction(function () use ($data) {

            $user = $this->userRepository->find(
                $data['user_id']
            );

            if (! $user) {
                throw new ApiException(
                    __('domains/user.not_found'),
                    404
                );
            }

            $period = $this->fundPeriodRepository->first(
                where: [
                    'id' => $data['period_id'],
                    'club_id' => $data['club_id'],
                ],
            );

            if (! $period) {
                throw new ApiException(
                    __('domains/fund_period.not_found'),
                    404
                );
            }

            // =============================================================
            // KHÓA KỲ
            // =============================================================

            $this->periodStateGuard->ensureUnlocked($period);

            // =============================================================
            // DUPLICATE
            // =============================================================

            $existing = $this->repository->findExistingForMemberPeriod(
                $data['club_id'],
                $data['user_id'],
                $data['period_id'],
            );

            if ($existing && ! $existing->trashed()) {
                if (
                    $existing->status === MonthlyContribution::STATUS_CANCELLED
                    && $existing->paid_by === MonthlyContribution::PAID_BY_BANK
                ) {
                    throw new ApiException(
                        __('domains/monthly_contribution.cancelled_bank_exists'),
                        422,
                        'CANCELLED_BANK_CONTRIBUTION_EXISTS',
                    );
                }

                throw new ApiException(
                    __('domains/monthly_contribution.already_exists'),
                    422
                );
            }

            // =============================================================
            // AMOUNT THEO GENDER
            // =============================================================

            $data['amount'] = $this->resolveAmount(
                $user,
                $period
            );

            if ($existing?->trashed()) {
                $existing->restore();

                return $this->repository->update($existing, [
                    'amount' => $data['amount'],
                    'status' => MonthlyContribution::STATUS_PENDING,
                    'transaction_id' => null,
                    'paid_by' => null,
                    'payment_date' => null,
                    'is_active' => true,
                ]);
            }

            $contribution = $this->repository->create(
                $this->withoutClientTransactionId($data),
            );

            return $this->syncPayment(
                $contribution,
                $data,
                (int) $data['club_id'],
            );
        });
    }

    // =========================================================================
    // CREATE FOR APPROVED MEMBER
    // =========================================================================

    /**
     * Dùng khi ClubMember được approve.
     *
     * Nếu kỳ đã locked thì KHÔNG được tạo contribution.
     */
    public function createForApprovedMember(
        ClubMember $member,
        FundPeriod $period
    ): ?MonthlyContribution {

        // =============================================================
        // KỲ ĐÃ KHÓA
        // =============================================================

        $this->periodStateGuard->ensureUnlocked($period);

        if ($this->contributionExists(
            $member->club_id,
            $member->user_id,
            $period->id,
        )) {
            return null;
        }

        return $this->create([
            'club_id' => $member->club_id,
            'user_id' => $member->user_id,
            'period_id' => $period->id,
            'status' => 'pending',
            'sort_order' => 0,
            'is_active' => true,
        ]);
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    public function update(
        int $id,
        array $data
    ): MonthlyContribution {
        return DB::transaction(function () use ($id, $data) {

            $contribution = $this->find($id, $data['club_id'] ?? null);

            // =============================================================
            // LẤY PERIOD HIỆN TẠI
            // =============================================================

            $currentPeriod = $this->fundPeriodRepository->find(
                $contribution->period_id
            );

            if (! $currentPeriod) {
                throw new ApiException(
                    __('domains/fund_period.not_found'),
                    404
                );
            }

            // =============================================================
            // KỲ HIỆN TẠI ĐÃ KHÓA
            // =============================================================

            $this->periodStateGuard->ensureUnlocked($currentPeriod);

            // =============================================================
            // XÁC ĐỊNH USER / PERIOD MỚI
            // =============================================================

            $userId = $data['user_id']
                ?? $contribution->user_id;

            $periodId = $data['period_id']
                ?? $contribution->period_id;

            // =============================================================
            // NẾU ĐỔI SANG PERIOD KHÁC
            // PHẢI KIỂM TRA PERIOD MỚI CŨNG CHƯA LOCK
            // =============================================================

            if ((int) $periodId !== (int) $currentPeriod->id) {

                $newPeriod = $this->fundPeriodRepository->first(
                    where: [
                        'id' => $periodId,
                        'club_id' => $contribution->club_id,
                    ],
                );

                if (! $newPeriod) {
                    throw new ApiException(
                        __('domains/fund_period.not_found'),
                        404
                    );
                }

                $this->periodStateGuard->ensureUnlocked($newPeriod);
            } else {
                $newPeriod = $currentPeriod;
            }

            // =============================================================
            // DUPLICATE
            // =============================================================

            $exists = $this->contributionExists(
                $contribution->club_id,
                $userId,
                $periodId,
                $contribution->id,
            );

            if ($exists) {
                throw new ApiException(
                    __('domains/monthly_contribution.already_exists'),
                    422
                );
            }

            // =============================================================
            // USER
            // =============================================================

            $user = $this->userRepository->find($userId);

            if (! $user) {
                throw new ApiException(
                    __('domains/user.not_found'),
                    404
                );
            }

            // =============================================================
            // AMOUNT
            // =============================================================

            $data['amount'] = $this->resolveAmount(
                $user,
                $newPeriod
            );

            // Không cho client thay đổi club.
            unset($data['club_id']);

            $oldTransactionId = $contribution->transaction_id;
            $requestedPaymentDate = $data['payment_date'] ?? null;
            $data = $this->withoutClientTransactionId($data);
            $targetStatus = $data['status'] ?? $contribution->status;
            $contribution = $this->repository->update($contribution, $data);

            if ($targetStatus !== MonthlyContribution::STATUS_PAID) {
                // Cash transactions are managed by this module and can be reversed.
                // Bank/webhook transactions are immutable evidence of money received.
                $this->removeLinkedTransaction($oldTransactionId, (int) $contribution->club_id, (int) $contribution->id);

                $linked = $oldTransactionId
                    ? $this->transactionRepository->findForContributionPayment(
                        (int) $oldTransactionId,
                        (int) $contribution->club_id,
                        MonthlyContribution::PAID_BY_BANK,
                        (int) $contribution->id,
                    )
                    : null;

                if ($linked && $requestedPaymentDate) {
                    $linked = $this->transactionRepository->update($linked, [
                        'transaction_date' => $requestedPaymentDate,
                    ]);
                }

                return $this->repository->update($contribution, [
                    'transaction_id' => $linked?->id,
                    'paid_by' => $linked ? MonthlyContribution::PAID_BY_BANK : null,
                    'payment_date' => $linked?->transaction_date,
                ]);
            }

            return $this->syncPayment($contribution, $data, (int) $contribution->club_id);
        });
    }

    // =========================================================================
    // TOGGLE STATUS
    // =========================================================================

    public function toggleStatus(
        int $id
    ): MonthlyContribution {
        return DB::transaction(function () use ($id) {

            $contribution = $this->find($id);

            $period = $this->fundPeriodRepository->find(
                $contribution->period_id
            );

            if (! $period) {
                throw new ApiException(
                    __('domains/fund_period.not_found'),
                    404
                );
            }

            // Không toggle contribution của kỳ đã khóa.
            $this->periodStateGuard->ensureUnlocked($period);

            return $this->repository->update($contribution, [
                'is_active' => ! $contribution->is_active,
            ]);
        });
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    public function deleteForClub(int $id, ?int $clubId): MonthlyContribution
    {
        return DB::transaction(function () use ($id, $clubId) {
            $contribution = $this->find($id, $clubId);
            $period = $this->fundPeriodRepository->find(
                $contribution->period_id,
            );

            if (! $period) {
                throw new ApiException(
                    __('domains/fund_period.not_found'),
                    404,
                );
            }

            $this->periodStateGuard->ensureUnlocked($period);

            if ($contribution->paid_by === MonthlyContribution::PAID_BY_BANK) {
                // Keep the monthly row and immutable bank receipt for auditability.
                $contribution = $this->repository->update($contribution, [
                    'status' => MonthlyContribution::STATUS_CANCELLED,
                    'is_active' => false,
                ]);

                $contribution->setAttribute('delete_action', 'cancelled');

                return $this->loadListRelations($contribution);
            }

            $this->removeLinkedTransaction($contribution->transaction_id, (int) $contribution->club_id, (int) $contribution->id);

            if (isset($contribution->sort_order)) {
                $this->repository->decrementSortOrderAfterDelete(
                    $contribution->sort_order,
                    $contribution->id,
                );
            }

            $this->loadListRelations($contribution);
            $this->repository->delete($contribution);
            $contribution->setAttribute('delete_action', 'deleted');

            return $contribution;
        });
    }

    // =========================================================================
    // GENERATE
    // =========================================================================

    /**
     * Sinh MonthlyContribution cho toàn bộ
     * member approved + active.
     */
    public function generateForPeriod(
        FundPeriod $period
    ): array {

        // =============================================================
        // KỲ ĐÃ KHÓA
        // Không được generate thêm.
        // =============================================================

        $this->periodStateGuard->ensureUnlocked($period);

        $members = $this->repository->getApprovedMembers(
            $period->club_id
        );

        if ($members->isEmpty()) {
            return [
                'created' => 0,
                'skipped' => 0,
            ];
        }

        $now = now();

        $rows = $members
            ->map(fn ($member) => [
                'club_id' => $period->club_id,
                'user_id' => $member->user_id,
                'period_id' => $period->id,

                'amount' => $this->resolveAmountFromGender(
                    $member->user->gender,
                    $period
                ),

                'status' => 'pending',
                'sort_order' => 0,
                'is_active' => true,

                'created_at' => $now,
                'updated_at' => $now,
            ])
            ->values()
            ->all();

        $created =
            $this->repository->bulkInsertIgnoreDuplicates(
                $rows
            );

        return [
            'created' => $created,
            'skipped' => count($rows) - $created,
        ];
    }

    // =========================================================================
    // HELPERS
    // =========================================================================

    /**
     * Tính amount theo gender.
     */
    protected function resolveAmount(
        $user,
        FundPeriod $period
    ): string|int|float {

        return $this->resolveAmountFromGender(
            $user->gender,
            $period
        );
    }

    /**
     * Tính amount theo gender.
     */
    protected function resolveAmountFromGender(
        ?string $gender,
        FundPeriod $period
    ): string|int|float {

        return match ($gender) {
            'male' => $period->male_amount,

            'female' => $period->female_amount,

            default => throw new ApiException(
                __('domains/monthly_contribution.gender_not_selected'),
                422
            ),
        };
    }

    protected function contributionExists(
        int $clubId,
        int $userId,
        int $periodId,
        ?int $ignoreId = null,
    ): bool {
        return $this->repository->exists(
            [
                'club_id' => $clubId,
                'user_id' => $userId,
                'period_id' => $periodId,
            ],
            $ignoreId,
        );
    }

    private function syncPayment(
        MonthlyContribution $contribution,
        array $data,
        int $clubId,
    ): MonthlyContribution {
        $status = $data['status'] ?? $contribution->status;

        if ($status !== MonthlyContribution::STATUS_PAID) {
            return $contribution;
        }

        $paidBy = $data['paid_by'] ?? $contribution->paid_by;

        if ($paidBy === MonthlyContribution::PAID_BY_BANK) {
            $transaction = $contribution->transaction_id
                ? $this->transactionRepository->findForContributionPayment(
                    (int) $contribution->transaction_id,
                    $clubId,
                    MonthlyContribution::PAID_BY_BANK,
                    (int) $contribution->id,
                )
                : null;

            if ($transaction) {
                if (! empty($data['payment_date'])) {
                    $transaction = $this->transactionRepository->update($transaction, [
                        'transaction_date' => $data['payment_date'],
                    ]);
                }

                return $this->repository->update($contribution, [
                    'paid_by' => MonthlyContribution::PAID_BY_BANK,
                    'payment_date' => $data['payment_date']
                        ?? $contribution->payment_date
                        ?? $transaction->transaction_date,
                ]);
            }

            throw new ApiException(
                __('domains/monthly_contribution.transaction_required'),
                422,
                'TRANSACTION_REQUIRED',
            );
        }

        if ($paidBy !== MonthlyContribution::PAID_BY_CASH) {
            throw new ApiException(
                __('domains/monthly_contribution.payment_method_required'),
                422,
                'PAYMENT_METHOD_REQUIRED',
            );
        }

        if ($contribution->transaction_id) {
            $transaction = $this->transactionRepository->findForContributionPayment(
                (int) $contribution->transaction_id,
                $clubId,
                MonthlyContribution::PAID_BY_CASH,
                (int) $contribution->id,
            );

            if ($transaction) {
                $transaction = $this->clubFundService->updateManagedTransaction(
                    (int) $transaction->id,
                    $clubId,
                    [
                        'amount' => $contribution->amount,
                        'transaction_date' => $data['payment_date']
                            ?? $contribution->payment_date
                            ?? $transaction->transaction_date,
                    ],
                );

                return $this->repository->update($contribution, [
                    'paid_by' => MonthlyContribution::PAID_BY_CASH,
                    'payment_date' => $data['payment_date']
                        ?? $contribution->payment_date
                        ?? $transaction->transaction_date,
                ]);
            }

            $this->removeLinkedTransaction(
                (int) $contribution->transaction_id,
                $clubId,
                (int) $contribution->id,
            );
        }

        $transaction = $this->clubFundService->recordTransaction([
            'club_id' => $clubId,
            'user_id' => $contribution->user_id,
            'source' => Transaction::SOURCE_CASH,
            'type' => Transaction::TYPE_INCOME,
            'amount' => $contribution->amount,
            'description' => __('domains/monthly_contribution.cash_transaction_description', [
                'month' => $contribution->period->month,
                'year' => $contribution->period->year,
                'fullname' => $contribution->user->fullname,
            ]),
            'transaction_date' => $data['payment_date'] ?? now(),
            'sort_order' => 0,
            'is_active' => true,
        ]);

        return $this->repository->update($contribution, [
            'transaction_id' => $transaction->id,
            'paid_by' => MonthlyContribution::PAID_BY_CASH,
            'payment_date' => $data['payment_date'] ?? $transaction->transaction_date,
        ]);
    }

    private function withoutClientTransactionId(array $data): array
    {
        unset($data['transaction_id']);

        if (($data['status'] ?? MonthlyContribution::STATUS_PENDING) !== MonthlyContribution::STATUS_PAID) {
            $data['paid_by'] = null;
            $data['payment_date'] = null;
        }

        return $data;
    }

    private function removeLinkedTransaction(?int $transactionId, int $clubId, ?int $contributionId = null): void
    {
        if ($transactionId) {
            $transaction = $this->transactionRepository->findForContributionPayment(
                $transactionId,
                $clubId,
                MonthlyContribution::PAID_BY_CASH,
                $contributionId,
            );

            if ($transaction) {
                $this->clubFundService->deleteManagedTransaction($transactionId, $clubId);
            }
        }
    }

    private function loadListRelations(MonthlyContribution $contribution): MonthlyContribution
    {
        return $contribution->load([
            'user:id,fullname,email,gender',
            'period:id,year,month,male_amount,female_amount,exchange_male_amount,exchange_female_amount,is_locked,is_active',
            'transaction:id,source,type,amount,reference_code,transaction_date',
            'paymentCode:id,monthly_contribution_id,payment_code,status,expired_at,used_at,is_active',
        ]);
    }
}

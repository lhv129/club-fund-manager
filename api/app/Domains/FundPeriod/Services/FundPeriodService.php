<?php

namespace App\Domains\FundPeriod\Services;

use App\Base\BaseService;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\FundPeriod\Repositories\FundPeriodRepository;
use App\Domains\MonthlyContribution\Services\MonthlyContributionService;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class FundPeriodService extends BaseService
{
    protected string $notFoundMessage = 'domains/fund_period.not_found';

    public function __construct(
        FundPeriodRepository $repository,
        protected MonthlyContributionService $contributionService,
    ) {
        parent::__construct($repository);
    }

    // =========================================================================
    // LIST / SEARCH
    // =========================================================================

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    public function cursorPaginate(array $filters = []): CursorPaginator
    {
        return $this->repository->getCursorList($filters);
    }

    public function getForSelect(array $filters = []): Collection
    {
        return $this->repository->getForSelect($filters);
    }

    // =========================================================================
    // FIND
    // =========================================================================

    /**
     * Find FundPeriod đang active trong database.
     *
     * Soft deleted sẽ không được tìm thấy.
     */
    public function find($id): FundPeriod
    {
        return parent::find($id);
    }

    /**
     * Find FundPeriod kèm relations.
     */
    public function findWithRelations(
        int $id,
        array $with = []
    ): FundPeriod {
        $fundPeriod = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (! $fundPeriod) {
            throw new ApiException(
                __($this->notFoundMessage),
                404
            );
        }

        return $fundPeriod;
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    /**
     * Tạo FundPeriod.
     *
     * Business rules:
     *
     * - Một club chỉ có duy nhất một kỳ theo year + month.
     * - Check cả record đã soft delete.
     * - Nếu kỳ cũ đã soft delete thì không tạo kỳ mới.
     * - Không tự động restore.
     * - Generate MonthlyContribution sau khi tạo.
     */
    public function create(array $data): FundPeriod
    {
        return DB::transaction(function () use ($data) {
            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            $clubId = (int) $data['club_id'];
            $year   = (int) $data['year'];
            $month  = (int) $data['month'];

            // -----------------------------------------------------------------
            // Duplicate check INCLUDING soft deleted
            // -----------------------------------------------------------------

            $existing = $this->repository
                ->findByClubAndDateWithTrashed(
                    $clubId,
                    $year,
                    $month
                );

            if ($existing) {
                if ($existing->trashed()) {
                    throw new ApiException(
                        __('domains/fund_period.deleted_period_exists'),
                        422
                    );
                }

                throw new ApiException(
                    __('domains/fund_period.already_exists'),
                    422
                );
            }

            // -----------------------------------------------------------------
            // Default values
            // -----------------------------------------------------------------

            $data['is_locked'] = false;

            if (! isset($data['sort_order'])) {
                $data['sort_order'] =
                    $this->repository->getNextSortOrder();
            }

            // -----------------------------------------------------------------
            // Create
            // -----------------------------------------------------------------

            $fundPeriod = $this->repository->createWithTranslations(
                $data,
                $translations
            );

            // -----------------------------------------------------------------
            // Generate MonthlyContribution
            // -----------------------------------------------------------------

            $this->contributionService->generateForPeriod(
                $fundPeriod
            );

            return $fundPeriod->fresh('translations');
        });
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    /**
     * Update FundPeriod.
     *
     * Signature PHẢI tương thích BaseService:
     *
     *     update(int $id, array $data)
     *
     * Business rules:
     *
     * - Không update FundPeriod đã locked.
     * - Không cho client đổi club_id.
     * - Nếu year/month thay đổi thì phải check duplicate.
     * - Check duplicate cả soft deleted.
     * - Không generate lại MonthlyContribution.
     */
    public function update(int $id, array $data): FundPeriod
    {
        return DB::transaction(function () use ($id, $data) {
            $fundPeriod = $this->find($id);

            // -----------------------------------------------------------------
            // Locked => không được sửa FundPeriod
            // -----------------------------------------------------------------

            $this->ensureUnlocked($fundPeriod);

            // -----------------------------------------------------------------
            // Không cho client thay đổi club
            //
            // club_id phải được xác định từ middleware / workspace.
            // -----------------------------------------------------------------

            unset($data['club_id']);

            // -----------------------------------------------------------------
            // Translation
            // -----------------------------------------------------------------

            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            // -----------------------------------------------------------------
            // Xác định year/month sau update
            // -----------------------------------------------------------------

            $year = array_key_exists('year', $data)
                ? (int) $data['year']
                : (int) $fundPeriod->year;

            $month = array_key_exists('month', $data)
                ? (int) $data['month']
                : (int) $fundPeriod->month;

            $clubId = (int) $fundPeriod->club_id;

            $periodChanged =
                $year !== (int) $fundPeriod->year ||
                $month !== (int) $fundPeriod->month;

            // -----------------------------------------------------------------
            // Nếu đổi year/month => check duplicate
            // -----------------------------------------------------------------

            if ($periodChanged) {
                $existing = $this->repository
                    ->findByClubAndDateWithTrashedExcept(
                        $clubId,
                        $year,
                        $month,
                        $fundPeriod->id
                    );

                if ($existing) {
                    if ($existing->trashed()) {
                        throw new ApiException(
                            __('domains/fund_period.deleted_period_exists'),
                            422
                        );
                    }

                    throw new ApiException(
                        __('domains/fund_period.already_exists'),
                        422
                    );
                }
            }

            // -----------------------------------------------------------------
            // Không cho request thay đổi trạng thái locked
            // -----------------------------------------------------------------

            $data['is_locked'] = $fundPeriod->is_locked;

            // -----------------------------------------------------------------
            // Update
            //
            // Gọi parent::update() để giữ đúng BaseService contract.
            // -----------------------------------------------------------------

            $fundPeriod = parent::update(
                $id,
                $data
            );

            // -----------------------------------------------------------------
            // Update translations nếu repository/domain của bạn hỗ trợ
            //
            // Nếu BaseService::update() không xử lý translations,
            // repository updateWithTranslations() sẽ phù hợp hơn.
            // -----------------------------------------------------------------

            if (! empty($translations)) {
                $fundPeriod = $this->repository
                    ->updateWithTranslations(
                        $fundPeriod,
                        $translations,
                        []
                    );
            }

            return $fundPeriod->fresh('translations');
        });
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    /**
     * Soft delete FundPeriod.
     *
     * Không xóa MonthlyContribution.
     * Không xóa Payment.
     *
     * Chỉ cho delete khi FundPeriod chưa locked.
     */
    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $fundPeriod = $this->find($id);

            // Không được xóa kỳ đã đóng.
            $this->ensureUnlocked($fundPeriod);

            // Không cascade delete MonthlyContribution.
            return (bool) $fundPeriod->delete();
        });
    }

    // =========================================================================
    // RESTORE
    // =========================================================================

    /**
     * Restore FundPeriod đã soft delete.
     *
     * Không generate MonthlyContribution lại.
     */
    public function restore(int $id): FundPeriod
    {
        return DB::transaction(function () use ($id) {
            $fundPeriod = $this->repository->findWithTrashed($id);

            if (! $fundPeriod) {
                throw new ApiException(
                    __($this->notFoundMessage),
                    404
                );
            }

            if (! $fundPeriod->trashed()) {
                throw new ApiException(
                    __('domains/fund_period.not_deleted'),
                    422
                );
            }

            // -----------------------------------------------------------------
            // Restore conflict
            // -----------------------------------------------------------------

            $conflict = $this->repository
                ->findByClubAndDateWithTrashedExcept(
                    (int) $fundPeriod->club_id,
                    (int) $fundPeriod->year,
                    (int) $fundPeriod->month,
                    $fundPeriod->id
                );

            if ($conflict && ! $conflict->trashed()) {
                throw new ApiException(
                    __('domains/fund_period.restore_conflict'),
                    422
                );
            }

            // -----------------------------------------------------------------
            // Restore đúng record cũ.
            //
            // Không generate lại MonthlyContribution.
            // -----------------------------------------------------------------

            $fundPeriod->restore();

            return $fundPeriod->fresh('translations');
        });
    }

    // =========================================================================
    // CLOSE
    // =========================================================================

    /**
     * Đóng FundPeriod.
     *
     * is_locked = true
     *
     * Sau khi đóng:
     *
     * - Không sửa FundPeriod.
     * - Không xóa FundPeriod.
     * - Không thêm/sửa/xóa MonthlyContribution.
     */
    public function close(int $id): FundPeriod
    {
        return DB::transaction(function () use ($id) {
            $fundPeriod = $this->find($id);

            if ($fundPeriod->is_locked) {
                throw new ApiException(
                    __('domains/fund_period.already_locked'),
                    422
                );
            }

            // Nếu sau này cần validate contribution trước khi đóng:
            //
            // $this->contributionService
            //     ->ensurePeriodCanBeClosed($fundPeriod);

            $fundPeriod->is_locked = true;
            $fundPeriod->save();

            return $fundPeriod->fresh('translations');
        });
    }

    // =========================================================================
    // REOPEN
    // =========================================================================

    /**
     * Mở lại FundPeriod đã đóng.
     *
     * Bắt buộc có reason.
     */
    public function reopen(
        int $id,
        string $reason
    ): FundPeriod {
        return DB::transaction(function () use ($id, $reason) {
            $fundPeriod = $this->find($id);

            if (! $fundPeriod->is_locked) {
                throw new ApiException(
                    __('domains/fund_period.not_locked'),
                    422
                );
            }

            $reason = trim($reason);

            if ($reason === '') {
                throw new ApiException(
                    __('domains/fund_period.reopen_reason_required'),
                    422
                );
            }

            $fundPeriod->is_locked = false;
            $fundPeriod->save();

            /*
             * TODO:
             *
             * Nếu có AuditLogService:
             *
             * action = fund_period.reopen
             * reason = $reason
             */

            return $fundPeriod->fresh('translations');
        });
    }

    // =========================================================================
    // TOGGLE STATUS
    // =========================================================================

    /**
     * Toggle is_active.
     *
     * FundPeriod locked => không được toggle.
     */
    public function toggleStatus(int $id): FundPeriod
    {
        return DB::transaction(function () use ($id) {
            $fundPeriod = $this->find($id);

            $this->ensureUnlocked($fundPeriod);

            $fundPeriod->is_active = ! $fundPeriod->is_active;
            $fundPeriod->save();

            return $fundPeriod->fresh('translations');
        });
    }

    // =========================================================================
    // GUARDS
    // =========================================================================

    /**
     * FundPeriod locked => không được sửa/xóa/toggle.
     */
    protected function ensureUnlocked(
        FundPeriod $fundPeriod
    ): void {
        if ($fundPeriod->is_locked) {
            throw new ApiException(
                __('domains/fund_period.locked'),
                422
            );
        }
    }
}

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
        protected FundPeriodStateGuard $stateGuard,
    ) {
        parent::__construct($repository);
    }

    // =========================================================================
    // LIST / SEARCH
    // =========================================================================

    /**
     * GET list FundPeriod.
     *
     * $filters['club_id'] được Controller inject từ middleware.
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    /**
     * Cursor pagination.
     */
    public function cursorPaginate(array $filters = []): CursorPaginator
    {
        return $this->repository->getCursorList($filters);
    }

    /**
     * Danh sách FundPeriod đã soft delete.
     */
    public function trashed(
        array $filters = []
    ): LengthAwarePaginator {
        return $this->repository->getTrashedList($filters);
    }

    /**
     * Danh sách dùng cho select.
     */
    public function getForSelect(array $filters = []): Collection
    {
        return $this->repository->getForSelect($filters);
    }

    // =========================================================================
    // FIND
    // =========================================================================

    /**
     * Find FundPeriod.
     *
     * Nếu truyền clubId thì bắt buộc FundPeriod phải thuộc club đó.
     */
    public function find(
        int $id,
        ?int $clubId = null,
        array $with = ['translations'],
    ): FundPeriod {
        $where = [
            'id' => $id,
        ];

        if ($clubId !== null) {
            $where['club_id'] = $clubId;
        }

        $fundPeriod = $this->repository->first(
            where: $where,
            with: $with,
            select: ['*'],
        );

        if (! $fundPeriod) {
            throw new ApiException(
                __($this->notFoundMessage),
                404,
            );
        }

        return $fundPeriod;
    }

    /**
     * Find FundPeriod kèm relations.
     */
    public function findWithRelations(
        int $id,
        array $with = [],
        ?int $clubId = null,
    ): FundPeriod {
        return $this->find(
            id: $id,
            clubId: $clubId,
            with: $with,
        );
    }

    /**
     * Find FundPeriod bao gồm soft deleted.
     *
     * Dùng cho restore.
     */
    protected function findWithTrashed(
        int $id,
        ?int $clubId = null,
    ): FundPeriod {
        $fundPeriod = $this->repository->findWithTrashed($id);

        if (! $fundPeriod) {
            throw new ApiException(
                __($this->notFoundMessage),
                404,
            );
        }

        if (
            $clubId !== null &&
            (int) $fundPeriod->club_id !== $clubId
        ) {
            throw new ApiException(
                __($this->notFoundMessage),
                404,
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
     * Controller phải inject:
     *
     * $data['club_id']
     *
     * từ middleware trước khi gọi Service.
     */
    public function create(array $data): FundPeriod
    {
        return DB::transaction(function () use ($data) {
            $clubId = (int) $data['club_id'];

            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            $year = (int) $data['year'];
            $month = (int) $data['month'];

            // -----------------------------------------------------------------
            // Duplicate check INCLUDING soft deleted
            // -----------------------------------------------------------------

            $existing = $this->repository
                ->findByClubAndDateWithTrashed(
                    $clubId,
                    $year,
                    $month,
                );

            if ($existing) {
                if ($existing->trashed()) {
                    throw new ApiException(
                        __('domains/fund_period.deleted_period_exists'),
                        422,
                    );
                }

                throw new ApiException(
                    __('domains/fund_period.already_exists'),
                    422,
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
                $translations,
            );

            // -----------------------------------------------------------------
            // Generate MonthlyContribution
            // -----------------------------------------------------------------

            $this->contributionService->generateForPeriod(
                $fundPeriod,
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
     * $data['club_id'] được Controller inject từ middleware.
     */
    public function update(
        int $id,
        array $data,
    ): FundPeriod {
        return DB::transaction(function () use (
            $id,
            $data,
        ) {
            $fundPeriod = $this->find(
                id: $id,
                clubId: $data['club_id'],
            );

            // -----------------------------------------------------------------
            // Locked => không được sửa
            // -----------------------------------------------------------------

            $this->ensureUnlocked($fundPeriod);

            // -----------------------------------------------------------------
            // Không cho client đổi club
            //
            // club_id chỉ dùng để scope.
            // Không update xuống DB.
            // -----------------------------------------------------------------

            $clubId = (int) $data['club_id'];
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
                        $fundPeriod->id,
                    );

                if ($existing) {
                    if ($existing->trashed()) {
                        throw new ApiException(
                            __('domains/fund_period.deleted_period_exists'),
                            422,
                        );
                    }

                    throw new ApiException(
                        __('domains/fund_period.already_exists'),
                        422,
                    );
                }
            }

            // -----------------------------------------------------------------
            // Không cho request thay đổi locked
            // -----------------------------------------------------------------

            $data['is_locked'] = $fundPeriod->is_locked;

            // -----------------------------------------------------------------
            // Update
            // -----------------------------------------------------------------

            $fundPeriod = parent::update(
                $id,
                $data,
            );

            // -----------------------------------------------------------------
            // Update translations
            // -----------------------------------------------------------------

            if (! empty($translations)) {
                $fundPeriod = $this->repository
                    ->updateWithTranslations(
                        $fundPeriod,
                        $translations,
                        [],
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
     * Controller truyền:
     *
     * $data['club_id']
     */
    public function delete(
        int $id,
        array $data = [],
    ): bool {
        return DB::transaction(function () use (
            $id,
            $data,
        ) {
            $fundPeriod = $this->find(
                id: $id,
                clubId: $data['club_id'],
            );

            $this->ensureUnlocked($fundPeriod);

            return (bool) $fundPeriod->delete();
        });
    }

    // =========================================================================
    // RESTORE
    // =========================================================================

    /**
     * Restore FundPeriod đã soft delete.
     */
    public function restore(
        int $id,
        array $data = [],
    ): FundPeriod {
        return DB::transaction(function () use (
            $id,
            $data,
        ) {
            $fundPeriod = $this->findWithTrashed(
                id: $id,
                clubId: $data['club_id'],
            );

            if (! $fundPeriod->trashed()) {
                throw new ApiException(
                    __('domains/fund_period.not_deleted'),
                    422,
                );
            }

            // -----------------------------------------------------------------
            // Restore conflict
            // -----------------------------------------------------------------

            $conflict = $this->repository
                ->findByClubAndDateWithTrashedExcept(
                    (int) $data['club_id'],
                    (int) $fundPeriod->year,
                    (int) $fundPeriod->month,
                    $fundPeriod->id,
                );

            if ($conflict && ! $conflict->trashed()) {
                throw new ApiException(
                    __('domains/fund_period.restore_conflict'),
                    422,
                );
            }

            $fundPeriod->restore();

            return $fundPeriod->fresh('translations');
        });
    }

    // =========================================================================
    // CLOSE
    // =========================================================================

    /**
     * Đóng FundPeriod.
     */
    public function close(
        int $id,
        array $data = [],
    ): FundPeriod {
        return DB::transaction(function () use (
            $id,
            $data,
        ) {
            $fundPeriod = $this->find(
                id: $id,
                clubId: $data['club_id'],
            );

            if ($fundPeriod->is_locked) {
                throw new ApiException(
                    __('domains/fund_period.already_locked'),
                    422,
                );
            }

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
     * $data:
     *
     * [
     *     'club_id' => 1,
     *     'reason'  => 'Điều chỉnh khoản đóng góp...',
     * ]
     */
    public function reopen(
        int $id,
        array $data,
    ): FundPeriod {
        return DB::transaction(function () use (
            $id,
            $data,
        ) {
            $fundPeriod = $this->find(
                id: $id,
                clubId: $data['club_id'],
            );

            if (! $fundPeriod->is_locked) {
                throw new ApiException(
                    __('domains/fund_period.not_locked'),
                    422,
                );
            }

            $reason = trim($data['reason']);

            if ($reason === '') {
                throw new ApiException(
                    __('domains/fund_period.reopen_reason_required'),
                    422,
                );
            }

            $fundPeriod->is_locked = false;
            $fundPeriod->save();

            /*
             * TODO:
             *
             * AuditLogService:
             *
             * action = fund_period.reopen
             * club_id = $fundPeriod->club_id
             * fund_period_id = $fundPeriod->id
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
     */
    public function toggleStatus(
        int $id,
        array $data = [],
    ): FundPeriod {
        return DB::transaction(function () use (
            $id,
            $data,
        ) {
            $fundPeriod = $this->find(
                id: $id,
                clubId: $data['club_id'],
            );

            $this->ensureUnlocked($fundPeriod);

            $fundPeriod->is_active =
                ! $fundPeriod->is_active;

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
        FundPeriod $fundPeriod,
    ): void {
        $this->stateGuard->ensureUnlocked($fundPeriod);
    }
}

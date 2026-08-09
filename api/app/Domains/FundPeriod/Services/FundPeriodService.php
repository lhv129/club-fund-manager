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

    // ── List / Search ────────────────────────────────────────────────────────

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

    // ── Single record ────────────────────────────────────────────────────────

    public function find($id): FundPeriod
    {
        return parent::find($id);
    }

    public function findWithRelations(int $id, array $with = []): FundPeriod
    {
        $fundPeriod = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$fundPeriod) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $fundPeriod;
    }

    // ── Write ────────────────────────────────────────────────────────────────

    /**
     * Tạo FundPeriod + tự động sinh MonthlyContribution cho tất cả member active.
     */
    public function create(array $data): FundPeriod
    {
        return DB::transaction(function () use ($data) {
            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            if (!isset($data['sort_order'])) {
                $data['sort_order'] = $this->repository->getNextSortOrder();
            }

            $fundPeriod = $this->repository->createWithTranslations($data, $translations);

            // Tự động sinh contribution cho tất cả member approved + active của club
            $this->contributionService->generateForPeriod($fundPeriod);

            return $fundPeriod;
        });
    }

    public function update(int $id, array $data): FundPeriod
    {
        return DB::transaction(function () use ($id, $data) {
            $fundPeriod   = $this->find($id);
            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            return $this->repository->updateWithTranslations($fundPeriod, $data, $translations);
        });
    }

    public function toggleStatus(int $id): FundPeriod
    {
        $fundPeriod = $this->find($id);
        $fundPeriod->is_active = !$fundPeriod->is_active;
        $fundPeriod->save();

        return $fundPeriod->fresh('translations');
    }
}

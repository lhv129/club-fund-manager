<?php

namespace App\Domains\FundPeriod\Services;

use App\Base\BaseService;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\FundPeriod\Repositories\FundPeriodRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class FundPeriodService extends BaseService
{
    protected string $notFoundMessage = 'domains/fund_period.not_found';

    public function __construct(FundPeriodRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

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

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(array $data): FundPeriod
    {
        return DB::transaction(function () use ($data) {
            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            if (!isset($data['sort_order'])) {
                $data['sort_order'] = $this->repository->getNextSortOrder();
            }

            return $this->repository->createWithTranslations($data, $translations);
        });
    }

    public function update(int $id, array $data): FundPeriod
    {
        return DB::transaction(function () use ($id, $data) {
            $fundPeriod = $this->find($id);

            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            return $this->repository->updateWithTranslations(
                $fundPeriod,
                $data,
                $translations
            );
        });
    }

    /**
     * Toggle is_active, trả về fund period kèm translations.
     */
    public function toggleStatus(int $id): FundPeriod
    {
        $fundPeriod          = $this->find($id);
        $fundPeriod->is_active = !$fundPeriod->is_active;
        $fundPeriod->save();

        return $fundPeriod->fresh('translations');
    }

    /**
     * Reorder khi kéo thả.
     */
    public function reorder(array $data): bool
    {
        DB::beginTransaction();

        try {
            foreach ($data as $item) {
                $this->repository->editWhere(
                    where: ['id' => $item['id']],
                    data: ['sort_order' => $item['sort_order']],
                );
            }

            DB::commit();
            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}

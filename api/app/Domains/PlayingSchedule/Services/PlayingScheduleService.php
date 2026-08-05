<?php

namespace App\Domains\PlayingSchedule\Services;

use App\Base\BaseService;
use App\Domains\PlayingSchedule\Models\PlayingSchedule;
use App\Domains\PlayingSchedule\Repositories\PlayingScheduleRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class PlayingScheduleService extends BaseService
{
    protected string $notFoundMessage = 'domains/playing_schedule.not_found';

    public function __construct(PlayingScheduleRepository $repository)
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

    public function find($id): PlayingSchedule
    {
        return parent::find($id);
    }

    public function findWithRelations(int $id, array $with = []): PlayingSchedule
    {
        $schedule = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$schedule) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $schedule;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(array $data): PlayingSchedule
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

    public function update(int $id, array $data): PlayingSchedule
    {
        return DB::transaction(function () use ($id, $data) {
            $schedule = $this->find($id);

            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            return $this->repository->updateWithTranslations(
                $schedule,
                $data,
                $translations
            );
        });
    }

    public function toggleStatus(int $id): PlayingSchedule
    {
        $schedule              = $this->find($id);
        $schedule->is_active   = !$schedule->is_active;
        $schedule->save();

        return $schedule->fresh('translations');
    }

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

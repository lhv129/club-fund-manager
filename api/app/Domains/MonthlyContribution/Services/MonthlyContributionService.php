<?php

namespace App\Domains\MonthlyContribution\Services;

use App\Base\BaseService;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\MonthlyContribution\Repositories\MonthlyContributionRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MonthlyContributionService extends BaseService
{
    protected string $notFoundMessage = 'domains/monthly_contribution.not_found';

    public function __construct(MonthlyContributionRepository $repository)
    {
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

    public function find($id): MonthlyContribution
    {
        return parent::find($id);
    }

    public function findWithRelations(int $id, array $with = []): MonthlyContribution
    {
        $contribution = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$contribution) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $contribution;
    }

    // ── Write ────────────────────────────────────────────────────────────────

    public function create(array $data): MonthlyContribution
    {
        return DB::transaction(function () use ($data) {
            if (!isset($data['sort_order'])) {
                $data['sort_order'] = $this->repository->getNextSortOrder();
            }

            return $this->repository->create($data);
        });
    }

    public function update(int $id, array $data): MonthlyContribution
    {
        return DB::transaction(function () use ($id, $data) {
            $contribution = $this->find($id);

            return $this->repository->update($contribution, $data);
        });
    }

    public function toggleStatus(int $id): MonthlyContribution
    {
        $contribution            = $this->find($id);
        $contribution->is_active = !$contribution->is_active;
        $contribution->save();

        return $contribution->fresh();
    }

    // ── Generate ─────────────────────────────────────────────────────────────

    /**
     * Sinh MonthlyContribution cho toàn bộ member approved + active của club.
     *
     * Gọi trong cùng transaction với FundPeriod::create().
     * Nếu member đã có contribution cho kỳ này → skip (nhờ unique constraint).
     *
     * @return array{created: int, skipped: int}
     */
    public function generateForPeriod(FundPeriod $period): array
    {
        // Lấy member approved + active, kèm gender từ users
        $members = $this->repository->getApprovedMembers($period->club_id);

        if ($members->isEmpty()) {
            return ['created' => 0, 'skipped' => 0];
        }

        $now  = now();
        $rows = $members->map(fn($member) => [
            'club_id'    => $period->club_id,
            'user_id'    => $member->user_id,
            'period_id'  => $period->id,
            'amount'     => $member->user->gender === 'male'
                ? $period->male_amount
                : $period->female_amount,
            'status'     => 'pending',
            'sort_order' => 0,
            'is_active'  => true,
            'created_at' => $now,
            'updated_at' => $now,
        ])->values()->all();

        $created = $this->repository->bulkInsertIgnoreDuplicates($rows);

        return [
            'created' => $created,
            'skipped' => count($rows) - $created,
        ];
    }
}

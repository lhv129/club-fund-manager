<?php

namespace App\Domains\MonthlyContribution\Services;

use App\Base\BaseService;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\MonthlyContribution\Repositories\MonthlyContributionRepository;
use App\Domains\User\Repositories\UserRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class MonthlyContributionService extends BaseService
{
    protected string $notFoundMessage = 'domains/monthly_contribution.not_found';

    protected object $userRepository;
    protected object $fundPeriod;
    public function __construct(
        MonthlyContributionRepository $repository,
        UserRepository $userRepository,
        FundPeriod $fundPeriod,
    ) {
        parent::__construct($repository);
        $this->userRepository = $userRepository;
        $this->fundPeriod = $fundPeriod;
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
        $exists = $this->repository->exists([
            'club_id' => $data['club_id'],
            'user_id' => $data['user_id'],
            'period_id' => $data['period_id'],
        ]);

        if ($exists) {
            throw new ApiException(
                __('domains/monthly_contribution.already_exists'),
                422
            );
        }

        return DB::transaction(function () use ($data) {

            $user = $this->userRepository->find($data['user_id']);

            $period = $this->fundPeriod->find($data['period_id']);

            $data['amount'] = match ($user->gender) {
                'male' => $period->male_amount,
                'female' => $period->female_amount,
                default => throw new ApiException(
                    __('domains/monthly_contribution.invalid_gender')
                ),
            };

            return $this->repository->create($data);
        });
    }

    public function update(int $id, array $data): MonthlyContribution
    {
        return DB::transaction(function () use ($id, $data) {
            $contribution = $this->find($id);

            $userId = $data['user_id'] ?? $contribution->user_id;
            $periodId = $data['period_id'] ?? $contribution->period_id;

            $exists = $this->repository->exists([
                'club_id' => $contribution->club_id,
                'user_id' => $userId,
                'period_id' => $periodId,
            ], $contribution->id);

            if ($exists) {
                throw new ApiException(
                    __('domains/monthly_contribution.invalid_gender'),
                    422
                );
            }

            $user = $this->userRepository->find($userId);
            $period = $this->fundPeriod->find($periodId);

            $data['amount'] = match ($user->gender) {
                'male' => $period->male_amount,
                'female' => $period->female_amount,
                default => throw new ApiException(
                    __('domains/monthly_contribution.gender_not_selected')
                ),
            };

            // Xoá club_id khỏi $data để không bị ghi null
            unset($data['club_id']);

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

<?php

namespace App\Domains\Dashboard\Club\Services;

use App\Base\BaseService;
use App\Domains\Dashboard\Club\Repositories\DashboardRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;

class DashboardService extends BaseService
{
    protected string $notFoundMessage = 'domains/dashboard.not_found';


    protected object $repository;
    public function __construct(
        DashboardRepository $repository,
    ) {
        parent::__construct($repository);
    }

    /**
     * Resolve dashboard period.
     *
     * Trả về:
     * - period
     * - date_from
     * - date_to
     */
    protected function resolvePeriod(array $filters = []): array
    {
        $period = $filters['period'] ?? 'month';

        [$dateFrom, $dateTo] = match ($period) {
            'last_year' => [
                now()->subYear()->startOfYear(),
                now()->subYear()->endOfYear(),
            ],

            'this_year' => [
                now()->startOfYear(),
                now()->endOfYear(),
            ],

            '6m' => [
                now()->subMonths(6)->startOfDay(),
                now()->endOfDay(),
            ],

            '3m' => [
                now()->subMonths(3)->startOfDay(),
                now()->endOfDay(),
            ],

            'previous_month' => [
                now()->subMonthNoOverflow()->startOfMonth(),
                now()->subMonthNoOverflow()->endOfMonth(),
            ],

            'month' => [
                now()->startOfMonth(),
                now()->endOfMonth(),
            ],

            'custom' => [
                now()->parse($filters['date_from'])->startOfDay(),
                now()->parse($filters['date_to'])->endOfDay(),
            ],

            default => [
                now()->startOfMonth(),
                now()->endOfMonth(),
            ],
        };

        $filters['period'] = $period;
        $filters['date_from'] = $dateFrom;
        $filters['date_to'] = $dateTo;

        return $filters;
    }



    /**
     * GET /api/v1/dashboard/memberStats
     */
    public function memberStats(array $filters = []): array
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->memberStats($filters);
    }

    /**
     * GET /api/v1/dashboard/fundPeriods
     */
    public function fundPeriods(array $filters = []): Collection
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->fundPeriods($filters);
    }

    /**
     * GET /api/v1/dashboard/contributions
     */
    public function contributions(array $filters = []): LengthAwarePaginator
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->contributions($filters);
    }

    /**
     * GET /api/v1/dashboard/sessions
     */
    public function sessions(array $filters = []): LengthAwarePaginator
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->sessions($filters);
    }

    /**
     * GET /api/v1/dashboard/transactions
     */
    public function transactions(array $filters = []): LengthAwarePaginator
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->transactions($filters);
    }

    /**
     * GET /api/v1/dashboard/cashFlow
     */
    public function cashFlow(array $filters = []): array
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->cashFlow($filters);
    }

    /**
     * GET /api/v1/dashboard/activity
     */
    public function activity(array $filters = []): array
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->activity($filters);
    }
}

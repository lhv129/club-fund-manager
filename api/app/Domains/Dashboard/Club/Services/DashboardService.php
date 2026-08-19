<?php

namespace App\Domains\Dashboard\Club\Services;

use App\Base\BaseService;
use App\Domains\Dashboard\Club\Repositories\DashboardRepository;

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

            '3m' => [
                now()->subMonths(2)->startOfMonth(),
                now()->endOfMonth(),
            ],

            '6m' => [
                now()->subMonths(5)->startOfMonth(),
                now()->endOfMonth(),
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

        // Dashboard charts default to daily data for a single month period.
        // Custom ranges up to 31 inclusive days are also readable at day level;
        // longer ranges are aggregated by month (including both boundary months).
        if (!array_key_exists('granularity', $filters) || $filters['granularity'] === null) {
            $filters['granularity'] = match ($period) {
                'month', 'previous_month' => 'day',
                'custom' => $dateFrom->copy()->startOfDay()->diffInDays($dateTo->copy()->startOfDay()) + 1 <= 31
                    ? 'day'
                    : 'month',
                default => 'month',
            };
        } else {
            $filters['granularity'] = $filters['granularity'] === 'day' ? 'day' : 'month';
        }

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
    public function fundPeriods(array $filters = [])
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->fundPeriods($filters);
    }

    public function fundBalance(array $filters = []): array
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->fundBalance($filters);
    }

    /**
     * GET /api/v1/dashboard/contributions
     */
    public function contributions(array $filters = []): array
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->contributions($filters);
    }

    /**
     * GET /api/v1/dashboard/sessions
     */
    public function sessions(array $filters = []): array
    {
        $filters = $this->resolvePeriod($filters);

        return $this->repository->sessions($filters);
    }

    /**
     * GET /api/v1/dashboard/transactions
     */
    public function transactions(array $filters = []): array
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

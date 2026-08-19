<?php

namespace App\Domains\Dashboard\Club\Controllers;

use App\Base\BaseController;
use App\Domains\Dashboard\Club\Requests\FilterDashboardRequest;
use App\Domains\Dashboard\Club\Resources\ContributionDashboardResource;
use App\Domains\Dashboard\Club\Resources\FundPeriodDashboardResource;
use App\Domains\Dashboard\Club\Resources\SessionDashboardResource;
use App\Domains\Dashboard\Club\Resources\TransactionDashboardResource;
use App\Domains\Dashboard\Club\Services\DashboardService;
use Illuminate\Http\JsonResponse;

class DashboardController extends BaseController
{
    public function __construct(
        protected DashboardService $service,
    ) {}

    protected function injectClubId(
        FilterDashboardRequest $request,
        array &$filters,
    ): void {
        $clubId = $request->attributes->get('club_id');

        if ($clubId !== null) {
            $filters['club_id'] = (int) $clubId;
        }
    }

    /**
     * GET /api/v1/dashboard/memberStats
     */
    public function memberStats(
        FilterDashboardRequest $request,
    ): JsonResponse {
        $filters = $request->validated();

        $this->injectClubId($request, $filters);

        $data = $this->service->memberStats($filters);

        return $this->responseCommon(
            true,
            __('domains/dashboard.member_stats'),
            $data,
            200,
        );
    }

    /**
     * GET /api/v1/dashboard/fundPeriods
     */
    public function fundPeriods(
        FilterDashboardRequest $request,
    ): JsonResponse {
        $filters = $request->validated();

        $this->injectClubId($request, $filters);

        $data = $this->service->fundPeriods($filters);

        return $this->responseCommon(true, __('domains/dashboard.fund_periods'), FundPeriodDashboardResource::collection($data), 200,);
    }

    public function fundBalance(FilterDashboardRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $this->injectClubId($request, $filters);

        return $this->responseCommon(
            true,
            __('domains/dashboard.fund_periods'),
            $this->service->fundBalance($filters),
            200,
        );
    }

    /**
     * GET /api/v1/dashboard/contributions
     */
    public function contributions(
        FilterDashboardRequest $request,
    ): JsonResponse {
        $filters = $request->validated();

        $this->injectClubId($request, $filters);

        $data = $this->service->contributions($filters);

        return $this->responseCommon(
            true,
            __('domains/dashboard.contributions'),
            [
                'summary' => $data['summary'],
                'items' => ContributionDashboardResource::collection(
                    $data['items'],
                ),
            ],
            200,
        );
    }

    /**
     * GET /api/v1/dashboard/sessions
     */
    public function sessions(
        FilterDashboardRequest $request,
    ): JsonResponse {
        $filters = $request->validated();

        $this->injectClubId($request, $filters);

        $data = $this->service->sessions($filters);

        return $this->responseCommon(
            true,
            __('domains/dashboard.sessions'),
            [
                'summary' => $data['summary'],
                'items' => SessionDashboardResource::collection(
                    $data['items'],
                ),
            ],
            200,
        );
    }

    /**
     * GET /api/v1/dashboard/transactions
     */
    public function transactions(
        FilterDashboardRequest $request,
    ): JsonResponse {
        $filters = $request->validated();

        $this->injectClubId($request, $filters);

        $data = $this->service->transactions($filters);

        return $this->responseCommon(
            true,
            __('domains/dashboard.transactions'),
            [
                'summary' => $data['summary'],
                'items' => TransactionDashboardResource::collection(
                    $data['items'],
                ),
            ],
            200,
        );
    }

    /**
     * GET /api/v1/dashboard/cashFlow
     */
    public function cashFlow(
        FilterDashboardRequest $request,
    ): JsonResponse {
        $filters = $request->validated();

        $this->injectClubId($request, $filters);

        $data = $this->service->cashFlow($filters);

        return $this->responseCommon(
            true,
            __('domains/dashboard.cash_flow'),
            $data,
            200,
        );
    }

    /**
     * GET /api/v1/dashboard/activity
     */
    public function activity(
        FilterDashboardRequest $request,
    ): JsonResponse {
        $filters = $request->validated();

        $this->injectClubId($request, $filters);

        $data = $this->service->activity($filters);

        return $this->responseCommon(
            true,
            __('domains/dashboard.activity'),
            $data,
            200,
        );
    }
}

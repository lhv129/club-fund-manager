<?php

namespace App\Domains\FundPeriod\Controllers;

use App\Base\BaseController;
use App\Domains\FundPeriod\Requests\FilterFundPeriodRequest;
use App\Domains\FundPeriod\Requests\ReopenFundPeriodRequest;
use App\Domains\FundPeriod\Requests\StoreFundPeriodRequest;
use App\Domains\FundPeriod\Requests\UpdateFundPeriodRequest;
use App\Domains\FundPeriod\Resources\FundPeriodResource;
use App\Domains\FundPeriod\Services\FundPeriodService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FundPeriodController extends BaseController
{
    public function __construct(
        protected FundPeriodService $service
    ) {}

    // =========================================================================
    // LIST
    // =========================================================================

    /**
     * GET /api/v1/fund-periods
     */
    public function index(FilterFundPeriodRequest $request): JsonResponse
    {
        $data = $request->validated();

        $data['club_id'] = $request->attributes->get('club_id');

        return $this->paginateResponse(
            $this->service->paginate($data),
            __('domains/fund_period.list'),
            FundPeriodResource::class,
        );
    }

    /**
     * GET /api/v1/fund-periods/cursor
     */
    public function cursorIndex(FilterFundPeriodRequest $request): JsonResponse
    {
        $data = $request->validated();

        $data['club_id'] = $request->attributes->get('club_id');

        return $this->cursorResponse(
            $this->service->cursorPaginate($data),
            __('domains/fund_period.list'),
            FundPeriodResource::class,
        );
    }

    /**
     * GET /api/v1/fund-periods/trashed
     *
     * Danh sách FundPeriod đã soft delete.
     */
    public function trashed(FilterFundPeriodRequest $request): JsonResponse {
        $data = $request->validated();

        $data['club_id'] = $request->attributes->get('club_id');

        return $this->paginateResponse(
            $this->service->trashed($data),
            __('domains/fund_period.trashed'),
            FundPeriodResource::class,
        );
    }

    /**
     * GET /api/v1/fund-periods/select
     */
    public function select(
        FilterFundPeriodRequest $request
    ): JsonResponse {
        $data = $request->validated();

        $data['club_id'] =
            $request->attributes->get('club_id');

        return $this->responseCommon(
            true,
            __('domains/fund_period.select'),
            $this->service->getForSelect($data),
        );
    }

    // =========================================================================
    // SHOW
    // =========================================================================

    /**
     * GET /api/v1/fund-periods/{id}
     */
    public function show(
        Request $request,
        int $id
    ): JsonResponse {
        $data = [
            'club_id' =>
            $request->attributes->get('club_id'),
        ];

        $fundPeriod = $this->service->findWithRelations(
            id: $id,
            with: [
                'translations',
                'club',
            ],
            clubId: $data['club_id'],
        );

        return $this->responseCommon(
            true,
            __('domains/fund_period.detail'),
            new FundPeriodResource($fundPeriod),
        );
    }

    // =========================================================================
    // CREATE
    // =========================================================================

    /**
     * POST /api/v1/fund-periods
     */
    public function store(
        StoreFundPeriodRequest $request
    ): JsonResponse {
        $data = $request->validated();

        $data['club_id'] =
            $request->attributes->get('club_id');

        $fundPeriod = $this->service->create($data);

        return $this->responseCommon(
            true,
            __('domains/fund_period.created'),
            new FundPeriodResource($fundPeriod),
            201,
        );
    }

    // =========================================================================
    // UPDATE
    // =========================================================================

    /**
     * PUT /api/v1/fund-periods/{id}
     */
    public function update(
        UpdateFundPeriodRequest $request,
        int $id
    ): JsonResponse {
        $data = $request->validated();

        $data['club_id'] =
            $request->attributes->get('club_id');

        $fundPeriod = $this->service->update(
            $id,
            $data,
        );

        return $this->responseCommon(
            true,
            __('domains/fund_period.updated'),
            new FundPeriodResource($fundPeriod),
        );
    }

    // =========================================================================
    // DELETE
    // =========================================================================

    /**
     * DELETE /api/v1/fund-periods/{id}
     */
    public function destroy(
        Request $request,
        int $id
    ): JsonResponse {
        $data = [
            'club_id' =>
            $request->attributes->get('club_id'),
        ];

        $this->service->delete(
            $id,
            $data,
        );

        return $this->responseCommon(
            true,
            __('domains/fund_period.deleted'),
        );
    }

    // =========================================================================
    // RESTORE
    // =========================================================================

    /**
     * POST /api/v1/fund-periods/{id}/restore
     */
    public function restore(
        Request $request,
        int $id
    ): JsonResponse {
        $data = [
            'club_id' =>
            $request->attributes->get('club_id'),
        ];

        $fundPeriod = $this->service->restore(
            $id,
            $data,
        );

        return $this->responseCommon(
            true,
            __('domains/fund_period.restored'),
            new FundPeriodResource($fundPeriod),
        );
    }

    // =========================================================================
    // CLOSE
    // =========================================================================

    /**
     * POST /api/v1/fund-periods/{id}/close
     */
    public function close(
        Request $request,
        int $id
    ): JsonResponse {
        $data = [
            'club_id' =>
            $request->attributes->get('club_id'),
        ];

        $fundPeriod = $this->service->close(
            $id,
            $data,
        );

        return $this->responseCommon(
            true,
            __('domains/fund_period.closed'),
            new FundPeriodResource($fundPeriod),
        );
    }

    // =========================================================================
    // REOPEN
    // =========================================================================

    /**
     * POST /api/v1/fund-periods/{id}/reopen
     */
    public function reopen(
        ReopenFundPeriodRequest $request,
        int $id
    ): JsonResponse {
        $data = $request->validated();

        $data['club_id'] =
            $request->attributes->get('club_id');

        $fundPeriod = $this->service->reopen(
            $id,
            $data,
        );

        return $this->responseCommon(
            true,
            __('domains/fund_period.reopened'),
            new FundPeriodResource($fundPeriod),
        );
    }

    // =========================================================================
    // TOGGLE STATUS
    // =========================================================================

    /**
     * POST /api/v1/fund-periods/{id}/toggle-status
     */
    public function toggleStatus(
        Request $request,
        int $id
    ): JsonResponse {
        $data = [
            'club_id' =>
            $request->attributes->get('club_id'),
        ];

        $fundPeriod = $this->service->toggleStatus(
            $id,
            $data,
        );

        return $this->responseCommon(
            true,
            $fundPeriod->is_active
                ? __('domains/fund_period.status_activated')
                : __('domains/fund_period.status_deactivated'),
            new FundPeriodResource($fundPeriod),
        );
    }
}

<?php

namespace App\Domains\FundPeriod\Controllers;

use App\Base\BaseController;
use App\Domains\FundPeriod\Requests\FilterFundPeriodRequest;
use App\Domains\FundPeriod\Requests\ReorderFundPeriodRequest;
use App\Domains\FundPeriod\Requests\StoreFundPeriodRequest;
use App\Domains\FundPeriod\Requests\UpdateFundPeriodRequest;
use App\Domains\FundPeriod\Resources\FundPeriodResource;
use App\Domains\FundPeriod\Services\FundPeriodService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FundPeriodController extends BaseController
{
    public function __construct(protected FundPeriodService $service) {}

    /**
     * GET /api/v1/fund-periods?search=abc&club_id=1&year=2026&is_active=1&sort_by=year&sort_dir=desc&limit=20&page=1
     */
    public function index(FilterFundPeriodRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/fund_period.list'),
            FundPeriodResource::class,
        );
    }

    /**
     * GET /api/v1/fund-periods/cursor?limit=10&cursor=eyJpZCI6MTAwfQ
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        return $this->cursorResponse(
            $this->service->cursorPaginate($request->only(['limit', 'search', 'club_id', 'year', 'is_active'])),
            __('domains/fund_period.list'),
            FundPeriodResource::class,
        );
    }

    /**
     * GET /api/v1/fund-periods/select — dropdown, không Resource, không phân trang.
     */
    public function select(Request $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/fund_period.select'),
            $this->service->getForSelect($request->only(['search', 'club_id', 'year', 'is_active', 'limit'])),
        );
    }

    /**
     * GET /api/v1/fund-periods/{id}
     */
    public function show(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/fund_period.detail'),
            new FundPeriodResource($this->service->findWithRelations($id, ['translations', 'club'])),
        );
    }

    /**
     * POST /api/v1/fund-periods
     */
    public function store(StoreFundPeriodRequest $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/fund_period.created'),
            new FundPeriodResource($this->service->create($request->validated())),
            201,
        );
    }

    /**
     * PUT /api/v1/fund-periods/{id}
     */
    public function update(UpdateFundPeriodRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/fund_period.updated'),
            new FundPeriodResource($this->service->update($id, $request->validated())),
        );
    }

    /**
     * DELETE /api/v1/fund-periods/{id} — xoá mềm + dồn sort_order.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/fund_period.deleted'));
    }

    /**
     * PATCH /api/v1/fund-periods/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/fund_period.status_toggled'),
            new FundPeriodResource($this->service->toggleStatus($id)),
        );
    }

    /**
     * POST /api/v1/fund-periods/reorder — kéo thả sort_order.
     * Body: [{ id: 1, sort_order: 2 }, { id: 2, sort_order: 1 }]
     */
    public function reorder(ReorderFundPeriodRequest $request): JsonResponse
    {
        $this->service->reorder($request->validated());

        return $this->responseCommon(true, __('domains/fund_period.reordered'));
    }
}

<?php

namespace App\Domains\FundPeriod\Controllers;

use App\Base\BaseController;
use App\Domains\FundPeriod\Requests\FilterFundPeriodRequest;
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
        $data = $request->validated();
        $data['club_id'] = $request->attributes->get('club_id');
        return $this->paginateResponse(
            $this->service->paginate($data),
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
    public function show(string $clubSlug, int $id): JsonResponse
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
        $data = $request->validated();
        $data['club_id'] = $request->attributes->get('club_id');
        return $this->responseCommon(
            true,
            __('domains/fund_period.created'),
            new FundPeriodResource($this->service->create($data)),
            201,
        );
    }

    /**
     * PUT /api/v1/fund-periods/{id}
     */
    public function update(UpdateFundPeriodRequest $request, string $clubSlug, int $id): JsonResponse
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
    public function destroy(string $clubSlug, int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/fund_period.deleted'));
    }

    /**
     * POST /api/v1/fund-periods/{id}/toggle-status
     */
    public function toggleStatus(string $clubSlug, int $id): JsonResponse
    {
        $fundPeriod = $this->service->toggleStatus($id);

        return $this->responseCommon(
            true,
            $fundPeriod->is_active
                ? __('domains/fund_period.status_activated')
                : __('domains/fund_period.status_deactivated'),
            new FundPeriodResource($fundPeriod),
        );
    }
}

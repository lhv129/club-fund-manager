<?php

namespace App\Domains\MonthlyContribution\Controllers;

use App\Base\BaseController;
use App\Domains\MonthlyContribution\Requests\FilterMonthlyContributionRequest;
use App\Domains\MonthlyContribution\Requests\StoreMonthlyContributionRequest;
use App\Domains\MonthlyContribution\Requests\UpdateMonthlyContributionRequest;
use App\Domains\MonthlyContribution\Resources\MonthlyContributionResource;
use App\Domains\MonthlyContribution\Services\MonthlyContributionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthlyContributionController extends BaseController
{
    public function __construct(protected MonthlyContributionService $service) {}

    /**
     * GET /api/v1/monthly-contributions
     *     ?search=&period_id=1&status=pending&paid_by=bank&is_active=1
     *     &sort_by=payment_date&sort_dir=desc&limit=20&page=1
     */
    public function index(FilterMonthlyContributionRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $filters['club_id'] = $request->attributes->get('club_id');
        return $this->paginateResponse(
            $this->service->paginate($filters),
            __('domains/monthly_contribution.list'),
            MonthlyContributionResource::class,
        );
    }

    /**
     * GET /api/v1/monthly-contributions/cursor?limit=10&cursor=eyJpZCI6MTAwfQ
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        return $this->cursorResponse(
            $this->service->cursorPaginate($request->only([
                'limit',
                'search',
                'club_id',
                'period_id',
                'status',
                'paid_by',
                'is_active',
            ])),
            __('domains/monthly_contribution.list'),
            MonthlyContributionResource::class,
        );
    }

    /**
     * GET /api/v1/monthly-contributions/select — dropdown, không Resource, không phân trang.
     */
    public function select(Request $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/monthly_contribution.select'),
            $this->service->getForSelect($request->only([
                'search',
                'club_id',
                'period_id',
                'status',
                'is_active',
                'limit',
            ])),
        );
    }

    /**
     * GET /api/v1/monthly-contributions/{id}
     */
    public function show(string $clubSlug, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/monthly_contribution.detail'),
            new MonthlyContributionResource(
                $this->service->findWithRelations($id, ['period', 'user', 'club', 'transaction', 'paymentCode'])
            ),
        );
    }

    /**
     * POST /api/v1/monthly-contributions
     */
    public function store(StoreMonthlyContributionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['club_id'] = $request->attributes->get('club_id');
        return $this->responseCommon(
            true,
            __('domains/monthly_contribution.created'),
            new MonthlyContributionResource($this->service->create($data)),
            201,
        );
    }

    /**
     * PUT /api/v1/monthly-contributions/{id}
     */
    public function update(UpdateMonthlyContributionRequest $request, string $clubSlug, int $id): JsonResponse
    {
        $data = $request->validated();

        return $this->responseCommon(
            true,
            __('domains/monthly_contribution.updated'),
            new MonthlyContributionResource(
                $this->service->update($id, $data)
            ),
        );
    }

    /**
     * DELETE /api/v1/monthly-contributions/{id} — xoá mềm + dồn sort_order.
     */
    public function destroy(string $clubSlug, int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/monthly_contribution.deleted'));
    }
}

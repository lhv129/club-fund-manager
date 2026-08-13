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
    public function __construct(
        protected FundPeriodService $service
    ) {}

    // =========================================================================
    // LIST
    // =========================================================================

    /**
     * GET /api/v1/fund-periods
     *
     * Workspace:
     *
     * - Có club_slug:
     *      middleware resolve -> club_id
     *      => chỉ lấy FundPeriod của club đó.
     *
     * - Không có club_slug:
     *      club_id = null
     *      => Global / Super Admin có thể xem tất cả club.
     */
    public function index(
        FilterFundPeriodRequest $request
    ): JsonResponse {
        $data = $request->validated();

        // Không tin club_id từ query.
        // club_id phải đến từ middleware.
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
    public function cursorIndex(
        Request $request
    ): JsonResponse {
        $data = $request->only([
            'limit',
            'search',
            'year',
            'month',
            'is_active',
            'is_locked',
        ]);

        // Workspace scope từ middleware.
        $data['club_id'] = $request->attributes->get('club_id');

        return $this->cursorResponse(
            $this->service->cursorPaginate($data),
            __('domains/fund_period.list'),
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

        // Workspace scope từ middleware.
        $data['club_id'] = $request->attributes->get('club_id');

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
        $clubId = $request->attributes->get('club_id');

        $fundPeriod = $this->service->findWithRelations(
            $id,
            ['translations', 'club'],
            $clubId,
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

        // Tuyệt đối không lấy club_id từ request body.
        //
        // Có club_slug:
        //     middleware -> club_id
        //
        // Không có club_slug:
        //     club_id = null
        //
        // Trường hợp create không có workspace thì Service nên từ chối.
        $data['club_id'] = $request->attributes->get('club_id');

        return $this->responseCommon(
            true,
            __('domains/fund_period.created'),
            new FundPeriodResource(
                $this->service->create($data)
            ),
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

        // Không cho client tự gửi club_id để đổi workspace.
        //
        // club_id phải được resolve từ club_slug middleware.
        $data['club_id'] = $request->attributes->get('club_id');

        $fundPeriod = $this->service->update(
            $id,
            $data
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
        $clubId = $request->attributes->get('club_id');

        $this->service->delete(
            $id,
            $clubId
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
        $clubId = $request->attributes->get('club_id');

        $fundPeriod = $this->service->restore(
            $id,
            $clubId
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
        $clubId = $request->attributes->get('club_id');

        $fundPeriod = $this->service->close(
            $id,
            $clubId
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
     *
     * Body:
     *
     * {
     *     "reason": "Điều chỉnh khoản đóng góp..."
     * }
     */
    public function reopen(
        Request $request,
        int $id
    ): JsonResponse {
        $request->validate([
            'reason' => [
                'required',
                'string',
                'min:5',
                'max:1000',
            ],
        ]);

        $clubId = $request->attributes->get('club_id');

        $fundPeriod = $this->service->reopen(
            $id,
            $clubId,
            $request->input('reason'),
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
        $clubId = $request->attributes->get('club_id');

        $fundPeriod = $this->service->toggleStatus(
            $id,
            $clubId
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

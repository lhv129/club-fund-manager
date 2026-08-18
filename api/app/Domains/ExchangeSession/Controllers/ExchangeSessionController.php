<?php

namespace App\Domains\ExchangeSession\Controllers;

use App\Base\BaseController;
use App\Domains\ExchangeSession\Requests\FilterExchangeSessionPlayersRequest;
use App\Domains\ExchangeSession\Requests\FilterExchangeSessionRequest;
use App\Domains\ExchangeSession\Requests\StoreExchangeSessionRequest;
use App\Domains\ExchangeSession\Requests\UpdateExchangeSessionRequest;
use App\Domains\ExchangeSession\Resources\ExchangeSessionPlayerResource;
use App\Domains\ExchangeSession\Resources\ExchangeSessionResource;
use App\Domains\ExchangeSession\Services\ExchangeSessionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExchangeSessionController extends BaseController
{
    public function __construct(protected ExchangeSessionService $service) {}

    /**
     * GET /api/v1/exchange-sessions?search=abc&club_id=1&status=upcoming&type=scheduled&session_date_from=2026-08-01&sort_by=session_date&sort_dir=asc&limit=20&page=1
     */
    public function index(FilterExchangeSessionRequest $request): JsonResponse
    {
        $filters = $request->validated();

        if (!array_key_exists('club_id', $filters)) {
            $filters['club_id'] = $request->attributes->get('club_id');
        }
        return $this->paginateResponse(
            $this->service->paginate($filters),
            __('domains/exchange_session.list'),
            ExchangeSessionResource::class,
        );
    }

    /**
     * GET /api/v1/exchange-sessions/cursor?limit=10&cursor=eyJpZCI6MTAwfQ
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        return $this->cursorResponse(
            $this->service->cursorPaginate($request->only(['limit', 'search', 'club_id', 'status', 'type', 'is_active'])),
            __('domains/exchange_session.list'),
            ExchangeSessionResource::class,
        );
    }

    /**
     * GET /api/v1/exchange-sessions/select — dropdown, không Resource, không phân trang.
     */
    public function select(Request $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/exchange_session.select'),
            $this->service->getForSelect($request->only(['search', 'club_id', 'status', 'is_active', 'limit'])),
        );
    }

    /**
     * GET /api/v1/exchange-sessions/{id}
     */
    public function show(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/exchange_session.detail'),
            new ExchangeSessionResource($this->service->findWithRelations($id, ['club', 'players', 'playingSchedule'])),
        );
    }

    /**
     * POST /api/v1/exchange-sessions
     */
    public function store(StoreExchangeSessionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['club_id'] = $request->attributes->get('club_id');
        return $this->responseCommon(
            true,
            __('domains/exchange_session.created'),
            new ExchangeSessionResource($this->service->create($data)),
            201,
        );
    }

    /**
     * PUT /api/v1/exchange-sessions/{id}
     */
    public function update(UpdateExchangeSessionRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();
        $data['club_id'] = $request->attributes->get('club_id');
        return $this->responseCommon(
            true,
            __('domains/exchange_session.updated'),
            new ExchangeSessionResource($this->service->update($id, $data)),
        );
    }

    /**
     * DELETE /api/v1/exchange-sessions/{id} — xoá mềm + dồn sort_order.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/exchange_session.deleted'));
    }

    /**
     * PATCH /api/v1/exchange-sessions/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/exchange_session.status_toggled'),
            new ExchangeSessionResource($this->service->toggleStatus($id)),
        );
    }

    /**
     * PATCH /api/v1/exchange-sessions/{id}/complete — chốt buổi đánh.
     */
    public function complete(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/exchange_session.completed'),
            new ExchangeSessionResource($this->service->complete($id)),
        );
    }

    /**
     * GET /api/v1/exchange-sessions/players
     *
     * Theo dõi thu tiền giao lưu toàn CLB.
     */
    public function players(
        FilterExchangeSessionPlayersRequest $request
    ): JsonResponse {
        $filters = $request->validated();

        $filters['club_id'] = $request->attributes->get('club_id');

        if ($filters['club_id'] !== null) {
            $filters['club_id'] = (int) $filters['club_id'];
        }

        return $this->paginateResponse($this->service->players($filters), __('domains/exchange_session.player_list'), ExchangeSessionPlayerResource::class);
    }
}

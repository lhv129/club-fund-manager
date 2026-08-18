<?php

namespace App\Domains\ExchangeSession\Controllers;

use App\Base\BaseController;
use App\Domains\ExchangeSession\Requests\StoreExchangeSessionPlayerRequest;
use App\Domains\ExchangeSession\Requests\UpdateExchangeSessionPlayerRequest;
use App\Domains\ExchangeSession\Resources\ExchangeSessionPlayerResource;
use App\Domains\ExchangeSession\Services\ExchangeSessionPlayerService;
use Illuminate\Http\JsonResponse;

class ExchangeSessionPlayerController extends BaseController
{
    public function __construct(protected ExchangeSessionPlayerService $service) {}

    /**
     * GET /api/v1/exchange-sessions/{sessionId}/players/{id}
     */
    public function show(int $sessionId, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/exchange_session.player_detail'),
            new ExchangeSessionPlayerResource($this->service->findBySession($sessionId, $id)),
        );
    }

    /**
     * POST /api/v1/exchange-sessions/{sessionId}/players
     */
    public function store(int $sessionId, StoreExchangeSessionPlayerRequest $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/exchange_session.player_created'),
            new ExchangeSessionPlayerResource($this->service->createForSession($sessionId, $request->validated())),
            201,
        );
    }

    /**
     * PUT /api/v1/exchange-sessions/{sessionId}/players/{id}
     */
    public function update(int $sessionId, int $id, UpdateExchangeSessionPlayerRequest $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/exchange_session.player_updated'),
            new ExchangeSessionPlayerResource($this->service->updateForSession($sessionId, $id, $request->validated())),
        );
    }

    /**
     * DELETE /api/v1/exchange-sessions/{sessionId}/players/{id}
     */
    public function destroy(int $sessionId, int $id): JsonResponse
    {
        $this->service->deleteFromSession($sessionId, $id);

        return $this->responseCommon(true, __('domains/exchange_session.player_deleted'));
    }

    /**
     * PUT /api/v1/exchange-sessions/{sessionId}/players/{id}/toggle-paid
     */
    public function togglePaid(int $sessionId, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/exchange_session.player_paid_toggled'),
            new ExchangeSessionPlayerResource($this->service->togglePaid($sessionId, $id)),
        );
    }
}

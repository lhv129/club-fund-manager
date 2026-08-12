<?php

namespace App\Domains\WebhookConfig\Controllers;

use App\Base\BaseController;
use App\Domains\WebhookConfig\Requests\FilterWebhookConfigRequest;
use App\Domains\WebhookConfig\Requests\StoreWebhookConfigRequest;
use App\Domains\WebhookConfig\Requests\UpdateWebhookConfigRequest;
use App\Domains\WebhookConfig\Resources\WebhookConfigResource;
use App\Domains\WebhookConfig\Services\WebhookConfigService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WebhookConfigController extends BaseController
{
    public function __construct(protected WebhookConfigService $service) {}

    /**
     * GET /api/v1/clubs/{clubSlug}/webhook-configs
     */
    public function index(FilterWebhookConfigRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $filters['club_id'] = $request->attributes->get('club_id');
        return $this->paginateResponse($this->service->paginate($filters), __('domains/webhook_config.list'), WebhookConfigResource::class,);
    }

    /**
     * GET /api/v1/clubs/{clubSlug}/webhook-configs/cursor
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        $filters = $request->only(['limit', 'search', 'type', 'is_active', 'is_verified', 'bank_account_id']);
        $filters['club_id'] = $request->attributes->get('club_id');
        return $this->cursorResponse($this->service->cursorPaginate($filters),__('domains/webhook_config.list'),WebhookConfigResource::class);
    }

    /**
     * GET /api/v1/clubs/{clubSlug}/webhook-configs/select — dropdown.
     */
    public function select(Request $request): JsonResponse
    {
        $filters = $request->only(['search', 'type', 'is_active', 'limit']);
        $filters['club_id'] = $request->attributes->get('club_id');
        return $this->responseCommon(true,__('domains/webhook_config.select'),$this->service->getForSelect($filters));
    }

    /**
     * GET /api/v1/clubs/{clubSlug}/webhook-configs/{id}
     */
    public function show(string $clubSlug, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/webhook_config.detail'),
            new WebhookConfigResource($this->service->findWithRelations($id, ['bankAccount'])),
        );
    }

    /**
     * POST /api/v1/clubs/{clubSlug}/webhook-configs
     */
    public function store(StoreWebhookConfigRequest $request, string $clubSlug): JsonResponse
    {
        $data = $request->validated();
        $data['club_id'] = $request->attributes->get('club_id');
        return $this->responseCommon(
            true,
            __('domains/webhook_config.created'),
            new WebhookConfigResource($this->service->create($data)),
            201,
        );
    }

    /**
     * PUT /api/v1/clubs/{clubSlug}/webhook-configs/{id}
     */
    public function update(UpdateWebhookConfigRequest $request, string $clubSlug, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/webhook_config.updated'),
            new WebhookConfigResource($this->service->update($id, $request->validated())),
        );
    }

    /**
     * DELETE /api/v1/clubs/{clubSlug}/webhook-configs/{id} — xoá mềm + dồn sort_order.
     */
    public function destroy(string $clubSlug, int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/webhook_config.deleted'));
    }

    /**
     * PATCH /api/v1/clubs/{clubSlug}/webhook-configs/{id}/toggle-status
     */
    public function toggleStatus(string $clubSlug, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/webhook_config.status_toggled'),
            new WebhookConfigResource($this->service->toggleStatus($id)),
        );
    }
}

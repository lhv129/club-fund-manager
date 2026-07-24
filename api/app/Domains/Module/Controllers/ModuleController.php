<?php

namespace App\Domains\Module\Controllers;

use App\Base\BaseController;
use App\Domains\Module\Requests\FilterModuleRequest;
use App\Domains\Module\Requests\StoreModuleRequest;
use App\Domains\Module\Requests\UpdateModuleRequest;
use App\Domains\Module\Resources\ModuleResource;
use App\Domains\Module\Services\ModuleService;
use Illuminate\Http\JsonResponse;

class ModuleController extends BaseController
{
    public function __construct(
        protected ModuleService $service
    ) {}

    /**
     * GET /api/v1/modules
     * Danh sách modules có phân trang, kèm actions (view/create/update/delete + is_active).
     */
    public function index(FilterModuleRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/module.list')
        );
    }

    /**
     * POST /api/v1/modules
     */
    public function store(StoreModuleRequest $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/module.created'),
            new ModuleResource($this->service->create($request->validated())),
            201
        );
    }

    /**
     * PUT /api/v1/modules/{id}
     */
    public function update(UpdateModuleRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/module.updated'),
            new ModuleResource($this->service->update($id, $request->validated()))
        );
    }

    /**
     * DELETE /api/v1/modules/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return $this->responseCommon(true, __('domains/module.deleted'));
    }

    /**
     * PATCH /api/v1/modules/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/module.status_toggled'),
            new ModuleResource($this->service->toggleStatus($id))
        );
    }
}

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
        protected ModuleService $moduleService
    ) {}

    /**
     * GET /api/v1/modules
     */
    public function index(FilterModuleRequest $request): JsonResponse
    {
        $modules = $this->moduleService->paginate($request->validated());

        return $this->paginateResponse($modules, __('domains/module.list'));
    }

    /**
     * GET /api/v1/modules/select
     * Danh sách gọn cho dropdown / autocomplete
     */
    public function select(FilterModuleRequest $request): JsonResponse
    {
        $params = $request->only(['search', 'is_active', 'limit']);
        $data   = $this->moduleService->getForSelect($params);

        return $this->responseCommon(true, __('domains/module.select'), $data);
    }

    /**
     * GET /api/v1/modules/{id}
     */
    public function show(int $id): JsonResponse
    {
        $module = $this->moduleService->find($id);

        return $this->responseCommon(true, __('domains/module.detail'), new ModuleResource($module));
    }

    /**
     * POST /api/v1/modules
     */
    public function store(StoreModuleRequest $request): JsonResponse
    {
        $module = $this->moduleService->create($request->validated());

        return $this->responseCommon(true, __('domains/module.created'), new ModuleResource($module), 201);
    }

    /**
     * PUT /api/v1/modules/{id}
     */
    public function update(UpdateModuleRequest $request, int $id): JsonResponse
    {
        $module = $this->moduleService->update($id, $request->validated());

        return $this->responseCommon(true, __('domains/module.updated'), new ModuleResource($module));
    }

    /**
     * DELETE /api/v1/modules/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->moduleService->delete($id);

        return $this->responseCommon(true, __('domains/module.deleted'));
    }

    /**
     * PATCH /api/v1/modules/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $module = $this->moduleService->toggleStatus($id);

        return $this->responseCommon(true, __('domains/module.status_toggled'), new ModuleResource($module));
    }
}

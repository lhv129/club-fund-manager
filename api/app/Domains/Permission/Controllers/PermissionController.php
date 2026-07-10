<?php

namespace App\Domains\Permission\Controllers;

use App\Base\BaseController;
use App\Domains\Permission\Requests\FilterPermissionRequest;
use App\Domains\Permission\Requests\StorePermissionRequest;
use App\Domains\Permission\Requests\UpdatePermissionRequest;
use App\Domains\Permission\Resources\PermissionResource;
use App\Domains\Permission\Services\PermissionService;
use Illuminate\Http\JsonResponse;

class PermissionController extends BaseController
{
    public function __construct(
        protected PermissionService $permissionService
    ) {}

    /**
     * GET /api/v1/permissions
     */
    public function index(FilterPermissionRequest $request): JsonResponse
    {
        $permissions = $this->permissionService->paginate($request->validated());

        return $this->paginateResponse($permissions, __('domains/permission.list'));
    }

    /**
     * GET /api/v1/permissions/by-module
     * Nhóm permissions theo module — dùng cho UI gán quyền
     */
    public function byModule(FilterPermissionRequest $request): JsonResponse
    {
        $params = $request->only(['is_active', 'module_id']);
        $data   = $this->permissionService->getGroupedByModule($params);

        return $this->responseCommon(true, __('domains/permission.list'), $data);
    }

    /**
     * GET /api/v1/permissions/{id}
     */
    public function show(int $id): JsonResponse
    {
        $permission = $this->permissionService->find($id);

        return $this->responseCommon(true, __('domains/permission.detail'), new PermissionResource($permission));
    }

    /**
     * POST /api/v1/permissions
     */
    public function store(StorePermissionRequest $request): JsonResponse
    {
        $permission = $this->permissionService->create($request->validated());

        return $this->responseCommon(true, __('domains/permission.created'), new PermissionResource($permission), 201);
    }

    /**
     * PUT /api/v1/permissions/{id}
     */
    public function update(UpdatePermissionRequest $request, int $id): JsonResponse
    {
        $permission = $this->permissionService->update($id, $request->validated());

        return $this->responseCommon(true, __('domains/permission.updated'), new PermissionResource($permission));
    }

    /**
     * DELETE /api/v1/permissions/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->permissionService->delete($id);

        return $this->responseCommon(true, __('domains/permission.deleted'));
    }

    /**
     * PATCH /api/v1/permissions/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $permission = $this->permissionService->toggleStatus($id);

        return $this->responseCommon(true, __('domains/permission.status_toggled'), new PermissionResource($permission));
    }
}

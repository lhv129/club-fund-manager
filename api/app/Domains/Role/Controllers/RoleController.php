<?php

namespace App\Domains\Role\Controllers;

use App\Base\BaseController;
use App\Domains\Role\Requests\FilterRoleRequest;
use App\Domains\Role\Requests\StoreRoleRequest;
use App\Domains\Role\Requests\UpdateRoleRequest;
use App\Domains\Role\Resources\RoleResource;
use App\Domains\Role\Services\RoleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoleController extends BaseController
{
    public function __construct(
        protected RoleService $roleService
    ) {}

    /**
     * GET /api/v1/roles
     */
    public function index(FilterRoleRequest $request): JsonResponse
    {
        $roles = $this->roleService->paginate($request->validated());

        return $this->paginateResponse($roles, __('domains/role.list'));
    }

    /**
     * GET /api/v1/roles/select
     * Danh sách gọn cho dropdown
     */
    public function select(Request $request): JsonResponse
    {
        $params = $request->only(['search', 'club_id', 'is_active', 'limit']);
        $data   = $this->roleService->getForSelect($params);

        return $this->responseCommon(true, __('domains/role.select'), $data);
    }

    /**
     * GET /api/v1/roles/{id}
     */
    public function show(int $id): JsonResponse
    {
        $role = $this->roleService->find($id);

        return $this->responseCommon(true, __('domains/role.detail'), new RoleResource($role));
    }

    /**
     * POST /api/v1/roles
     */
    public function store(StoreRoleRequest $request): JsonResponse
    {
        $role = $this->roleService->create($request->validated());

        return $this->responseCommon(true, __('domains/role.created'), new RoleResource($role), 201);
    }

    /**
     * PUT /api/v1/roles/{id}
     */
    public function update(UpdateRoleRequest $request, int $id): JsonResponse
    {
        $role = $this->roleService->update($id, $request->validated());

        return $this->responseCommon(true, __('domains/role.updated'), new RoleResource($role));
    }

    /**
     * DELETE /api/v1/roles/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->roleService->delete($id);

        return $this->responseCommon(true, __('domains/role.deleted'));
    }

    /**
     * PATCH /api/v1/roles/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $role = $this->roleService->toggleStatus($id);

        return $this->responseCommon(true, __('domains/role.status_toggled'), new RoleResource($role));
    }

    /**
     * POST /api/v1/roles/{id}/permissions
     * Sync toàn bộ danh sách permissions cho role
     */
    public function syncPermissions(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'permission_ids'   => ['required', 'array'],
            'permission_ids.*' => ['integer', 'exists:permissions,id'],
        ]);

        $role = $this->roleService->syncPermissions($id, $request->input('permission_ids', []));

        return $this->responseCommon(true, __('domains/role.permissions_synced'), new RoleResource($role));
    }
}

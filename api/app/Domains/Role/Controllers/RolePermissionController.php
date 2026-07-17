<?php

namespace App\Domains\Role\Controllers;

use App\Base\BaseController;
use App\Domains\Role\Requests\AssignPermissionRequest;
use App\Domains\Role\Services\RolePermissionService;
use Illuminate\Http\JsonResponse;


class RolePermissionController extends BaseController
{
    public function __construct(
        protected RolePermissionService $service
    ) {}

    /**
     * POST /api/v1/roles/{id}/permissions
     * Sync toàn bộ danh sách permissions cho role
     */
    public function syncPermissions(AssignPermissionRequest $request): JsonResponse
    {
        $rolePermissions = $this->service->syncPermissions($request->validated());
        return $this->responseCommon(true, __('domains/role.permissions_synced'), $rolePermissions);
    }
}

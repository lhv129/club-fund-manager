<?php

namespace App\Domains\Role\Services;

use App\Base\BaseService;
use App\Domains\Module\Repositories\ModuleRepository;
use App\Domains\Role\Repositories\RolePermissionRepository;
use App\Domains\Role\Repositories\RoleRepository;
use App\Exceptions\ApiException;


class RolePermissionService extends BaseService
{
    public function __construct(
        RolePermissionRepository $repository,
        protected RoleRepository $roleRepository,
        protected ModuleRepository $moduleRepository,
    ) {
        parent::__construct($repository);
    }

    public function syncPermissions(array $data): array
    {
        $role = $this->roleRepository->findBySlug($data['slug']);

        if (!$role) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        $permissionIds = collect($data['permission_ids'])
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $this->roleRepository->syncPermissions($role, $permissionIds);

        // Assembly giống RoleService::getPermissionsBySlug
        $activeIds = $this->roleRepository->getActivePermissionIds($role->id);
        $modules   = $this->moduleRepository->getAllWithPermissions();

        return $modules
            ->map(fn($module) => [
                'module_id' => $module->id,
                'module'    => $module->slug,
                'label'     => $module->translation?->name ?? $module->slug,
                'actions'   => $module->permissions
                    ->map(fn($p) => [
                        'id'      => $p->id,
                        'name'    => $p->action,
                        'checked' => in_array($p->id, $activeIds, true),
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }
}

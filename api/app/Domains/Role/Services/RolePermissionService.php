<?php

namespace App\Domains\Role\Services;

use App\Base\BaseService;
use App\Domains\Module\Repositories\ModuleRepository;
use App\Domains\Role\Repositories\RolePermissionRepository;
use App\Domains\Role\Repositories\RoleRepository;
use App\Exceptions\ApiException;
use App\Services\Authorization\PermissionCacheService;


class RolePermissionService extends BaseService
{
    public function __construct(
        RolePermissionRepository $repository,
        protected RoleRepository $roleRepository,
        protected ModuleRepository $moduleRepository,
        protected PermissionCacheService $permissionCache,
    ) {
        parent::__construct($repository);
    }

    public function syncPermissions(array $data): array
    {
        $role = $this->roleRepository->findBySlug($data['slug']);

        $role->load([
            'translations:id,role_id,locale,name'
        ]);

        if (!$role) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        $permissionIds = collect($data['permission_ids'])
            ->map(fn($id) => (int) $id)
            ->unique()
            ->values()
            ->all();

        $this->roleRepository->syncPermissions($role, $permissionIds);
        $this->permissionCache->forgetAll();

        // Assembly giống RoleService::getPermissionsBySlug
        $activeIds = $this->roleRepository->getActivePermissionIds($role->id);
        $modules   = $this->moduleRepository->getAllWithPermissions();

        return [
            'id' => $role->id,
            'slug' => $role->slug,
            'translations' => $role->translations,
            'permissions' => $modules
                ->map(fn($module) => [
                    'module_id' => $module->id,
                    'module' => $module->slug,
                    'label' => $module->translations,
                    'actions' => $module->permissions
                        ->map(fn($p) => [
                            'id' => $p->id,
                            'name' => $p->action,
                            'checked' => in_array($p->id, $activeIds, true),
                        ])
                        ->values()
                        ->all(),
                ])
                ->values()
                ->all(),
        ];
    }
}

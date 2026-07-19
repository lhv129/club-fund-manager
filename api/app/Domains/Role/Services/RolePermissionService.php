<?php

namespace App\Domains\Role\Services;

use App\Base\BaseService;
use App\Domains\Role\Repositories\RolePermissionRepository;
use App\Domains\Role\Repositories\RoleRepository;
use App\Exceptions\ApiException;


class RolePermissionService extends BaseService
{
    protected $roleRepository;

    public function __construct(
        RolePermissionRepository $repository,
        RoleRepository $roleRepository
    ) {
        parent::__construct($repository);
        $this->roleRepository = $roleRepository;
    }

    protected string $notFoundMessage = 'domains/role.not_found';

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

        // Delegate toàn bộ sync logic xuống RoleRepository
        // (đã xử lý đúng: toAdd / toRemove / toRestore kể cả soft-deleted rows)
        $this->roleRepository->syncPermissions($role, $permissionIds);

        return $this->roleRepository->getPermissionsBySlug($role->slug);
    }
}

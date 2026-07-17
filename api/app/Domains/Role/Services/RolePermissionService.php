<?php

namespace App\Domains\Role\Services;

use App\Base\BaseService;
use App\Domains\Role\Repositories\RolePermissionRepository;
use App\Domains\Role\Repositories\RoleRepository;
use App\Exceptions\ApiException;
use Illuminate\Support\Facades\DB;


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

    public function syncPermissions(array $data)
    {
        DB::beginTransaction();

        try {
            $role = $this->roleRepository->findBySlug($data['slug']);

            if (!$role) {
                throw new ApiException(__($this->notFoundMessage), 404);
            }

            // unique + sạch
            $newPermissions = collect($data['permission_ids'])
                ->unique()
                ->values()
                ->toArray();

            // lấy full pivot (id => is_active)
            $existing = $this->repository->getRolePermissions($role);

            /**
             * 1. Update tất cả existing → bật/tắt theo payload
             */
            foreach ($existing as $permissionId => $isActive) {
                $this->repository->updatePivot($role, $permissionId, [
                    'is_active' => in_array($permissionId, $newPermissions) ? 1 : 0
                ]);
            }

            /**
             * 2. Insert những cái chưa có
             */
            foreach ($newPermissions as $permissionId) {
                if (!array_key_exists($permissionId, $existing)) {
                    $this->repository->attach($role, $permissionId, [
                        'is_active' => 1
                    ]);
                }
            }

            DB::commit();

            return app(RoleService::class)->getPermissionsBySlug($role->slug);
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }
}

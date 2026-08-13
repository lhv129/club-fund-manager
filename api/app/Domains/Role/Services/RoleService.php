<?php

namespace App\Domains\Role\Services;

use App\Base\BaseService;
use App\Domains\Module\Repositories\ModuleRepository;
use App\Domains\Role\Models\Role;
use App\Domains\Role\Repositories\RolePermissionRepository;
use App\Domains\Role\Repositories\RoleRepository;
use App\Exceptions\ApiException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use App\Services\Authorization\PermissionCacheService;

class RoleService extends BaseService
{
    protected string $notFoundMessage = 'domains/role.not_found';

    public function __construct(
        RoleRepository $repository,
        protected ModuleRepository $moduleRepository,
        protected RolePermissionRepository $rolePermissionRepository,
        protected PermissionCacheService $permissionCache,
    ) {
        parent::__construct($repository);
    }

    /**
     * Override để eager load permissions.
     */
    public function find($id): Role
    {
        return $this->findByConditions(
            ['id' => $id],
            ['*'],
            [
                'translations'
            ]
        );
    }

    public function findBySlug(string $slug)
    {
        $role = $this->repository->findBySlug(
            $slug,
            ['id', 'slug'],
        );

        if (!$role) {
            throw new ApiException($this->notFoundMessage, 404);
        }

        return $role->load('translation:id,role_id,locale,name,description');
    }

    /**
     * Create.
     */
    public function create(array $data): Role
    {
        $translations = $data['translations'] ?? [];

        unset($data['translations']);

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        } else {
            $this->repository->applySortOrder((int) $data['sort_order']);
        }

        $role = DB::transaction(function () use ($data, $translations) {
            return $this->repository->createWithTranslations(
                $data,
                $translations
            );
        });

        return $role->load([
            'translations'
        ]);
    }

    /**
     * Update.
     */
    public function update(int $id, array $data): Role
    {
        $role = $this->find($id);

        $translations = $data['translations'] ?? [];

        unset($data['translations']);

        if (
            isset($data['sort_order'])
            && (int) $data['sort_order'] !== $role->sort_order
        ) {
            $this->repository->applySortOrder(
                (int) $data['sort_order'],
                $role->id,
                $role->sort_order
            );
        }

        DB::transaction(function () use (
            $role,
            $data,
            $translations
        ) {
            $this->repository->updateWithTranslations(
                $role,
                $data,
                $translations
            );
        });

        $this->permissionCache->forgetAll();

        return $role->load('translations');
    }

    public function delete(int $id)
    {
        $role = $this->find($id);

        DB::transaction(function () use ($role, $id) {
            if (isset($role->sort_order)) {
                $this->repository->decrementSortOrderAfterDelete(
                    $role->sort_order,
                    $id
                );
            }

            $this->rolePermissionRepository->deleteByRoleId($role->id);

            $role->translations()->delete();

            $this->repository->delete($role);
        });

        $this->permissionCache->forgetAll();

        return true;
    }

    public function toggleStatus(int $id): Role
    {
        /** @var Role */
        $role = parent::toggleStatus($id);
        $this->permissionCache->forgetAll();

        return $role;
    }

    public function getForSelect(array $filters = []): Collection
    {
        return parent::getForSelect($filters);
    }

    /**
     * Danh sách tất cả modules + permissions, kèm trạng thái checked theo role.
     * Assembly logic nằm ở đây thay vì trong Repository.
     */
    public function getPermissionsBySlug(string $slug): array
    {
        $role = $this->repository->findBySlug($slug);

        $role->load([
            'translations:id,role_id,locale,name'
        ]);

        if (!$role) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        $activeIds = $this->repository->getActivePermissionIds($role->id);

        $modules = $this->moduleRepository->getAllWithPermissions();

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

<?php

namespace App\Domains\Role\Services;

use App\Base\BaseService;
use App\Domains\Module\Repositories\ModuleRepository;
use App\Domains\Role\Models\Role;
use App\Domains\Role\Repositories\RoleRepository;
use App\Exceptions\ApiException;
use Illuminate\Database\Eloquent\Collection;

class RoleService extends BaseService
{
    protected string $notFoundMessage = 'domains/role.not_found';

    public function __construct(
        RoleRepository $repository,
        protected ModuleRepository $moduleRepository,
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
                'translations',
                'permissions.translations'
            ]
        );
    }

    /**
     * Create.
     */
    public function create(array $data): Role
    {
        $translations = $data['translations'] ?? [];

        $permissionIds = $data['permission_ids'] ?? [];

        unset(
            $data['translations'],
            $data['permission_ids']
        );

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        } else {
            $this->repository->applySortOrder($data['sort_order']);
        }

        $role = $this->repository
            ->createWithTranslations($data, $translations);

        $this->repository
            ->syncPermissions($role, $permissionIds);

        return $role->load([
            'translations',
            'permissions.translations'
        ]);
    }

    /**
     * Update.
     */
    public function update(int $id, array $data): Role
    {
        $role = $this->find($id);

        $translations = $data['translations'] ?? [];

        $permissionIds = $data['permission_ids'] ?? null;

        unset(
            $data['translations'],
            $data['permission_ids']
        );

        if (
            isset($data['sort_order'])
            && $data['sort_order'] != $role->sort_order
        ) {
            $this->repository->applySortOrder(
                $data['sort_order'],
                $role->id,
                $role->sort_order
            );
        }

        $role = $this->repository
            ->updateWithTranslations(
                $role,
                $data,
                $translations
            );

        if ($permissionIds !== null) {
            $this->repository
                ->syncPermissions($role, $permissionIds);
        }

        return $role->load([
            'translations',
            'permissions.translations'
        ]);
    }

    public function delete(int $id): bool
    {
        return $this->deleteWithSortOrder($id);
    }

    public function toggleStatus(int $id): Role
    {
        /** @var Role */
        return parent::toggleStatus($id);
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

        if (!$role) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        $activeIds = $this->repository->getActivePermissionIds($role->id);

        $modules = $this->moduleRepository->getAllWithPermissions();

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

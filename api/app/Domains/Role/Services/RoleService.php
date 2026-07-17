<?php

namespace App\Domains\Role\Services;

use App\Base\BaseService;
use App\Domains\Role\Models\Role;
use App\Domains\Role\Repositories\RoleRepository;
use App\Exceptions\ApiException;
use Illuminate\Database\Eloquent\Collection;

class RoleService extends BaseService
{
    protected string $notFoundMessage = 'domains/role.not_found';

    public function __construct(RoleRepository $repository)
    {
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

    public function syncPermissions(
        int $id,
        array $permissionIds
    ): Role {

        $role = $this->find($id);

        $this->repository
            ->syncPermissions($role, $permissionIds);

        return $role->load([
            'translations',
            'permissions.translations'
        ]);
    }

    public function getForSelect(array $filters = []): Collection
    {
        return parent::getForSelect($filters);
    }

    /**
     * Danh sách permissions theo module, kèm trạng thái checked của role.
     */
    public function getPermissionsBySlug(string $slug): array
    {
        $data = $this->repository->getPermissionsBySlug($slug);

        if ($data === null) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $data;
    }
}

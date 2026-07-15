<?php

namespace App\Domains\Permission\Services;

use App\Base\BaseService;
use App\Domains\Permission\Models\Permission;
use App\Domains\Permission\Repositories\PermissionRepository;

class PermissionService extends BaseService
{
    protected string $notFoundMessage = 'domains/permission.not_found';

    public function __construct(PermissionRepository $repository)
    {
        parent::__construct($repository);
    }

    /**
     * Override để eager load module + translations.
     */
    public function find($id): Permission
    {
        return $this->findByConditions(
            ['id' => $id],
            ['*'],
            [
                'translations',
                'module.translations',
            ]
        );
    }

    /**
     * Tạo permission.
     */
    public function create(array $data): Permission
    {
        $translations = $data['translations'] ?? [];

        unset($data['translations']);

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        } else {
            $this->repository->applySortOrder($data['sort_order']);
        }

        return $this->repository
            ->createWithTranslations($data, $translations);
    }

    /**
     * Cập nhật permission.
     */
    public function update(int $id, array $data): Permission
    {
        $permission = $this->find($id);

        $translations = $data['translations'] ?? [];

        unset($data['translations']);

        if (
            isset($data['sort_order'])
            && $data['sort_order'] != $permission->sort_order
        ) {
            $this->repository->applySortOrder(
                $data['sort_order'],
                $permission->id,
                $permission->sort_order
            );
        }

        return $this->repository
            ->updateWithTranslations(
                $permission,
                $data,
                $translations
            );
    }

    public function delete(int $id): bool
    {
        return $this->deleteWithSortOrder($id);
    }

    public function toggleStatus(int $id): Permission
    {
        /** @var Permission */
        return parent::toggleStatus($id);
    }

    /**
     * UI gán quyền theo module.
     */
    public function getGroupedByModule(array $filters = []): array
    {
        return $this->repository->getGroupedByModule($filters);
    }
}

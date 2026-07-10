<?php

namespace App\Domains\Permission\Services;

use App\Base\BaseService;
use App\Domains\Permission\Models\Permission;
use App\Domains\Permission\Repositories\PermissionRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PermissionService extends BaseService
{
    protected string $notFoundMessage = 'domains/permission.not_found';

    public function __construct(PermissionRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * GET /api/v1/permissions  (phân trang)
     *
     * Params: search, module_id, action, is_active, sort_by, sort_dir, limit, page
     */
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $where   = $this->buildWhere($params, ['module_id', 'action', 'is_active']);
        $orderBy = $this->buildOrderBy($params, ['id', 'sort_order', 'created_at']);

        if (!empty($params['search'])) {
            $where['whereHas'] = [['translations', ['name' => ['name', 'like', $params['search']]]]];
        }

        return $this->repository->paginate(
            where: $where,
            orderBy: $orderBy,
            select: ['id', 'module_id', 'action', 'sort_order', 'is_active', 'created_at'],
            with: ['translations', 'module.translations'],
            limit: (int) ($params['limit'] ?? 0),
            page: (int) ($params['page'] ?? 1),
        );
    }

    /**
     * GET /api/v1/permissions/by-module
     * Nhóm permissions theo module — dùng cho UI checkbox gán quyền
     *
     * Return:
     * [
     *   { module: {...}, permissions: [...] },
     *   ...
     * ]
     */
    public function getGroupedByModule(array $params = []): array
    {
        $where = $this->buildWhere($params, ['is_active']);

        if (!empty($params['module_id'])) {
            $where['module_id'] = $params['module_id'];
        }

        $permissions = $this->repository->get(
            where: $where,
            orderBy: ['module_id' => 'asc', 'sort_order' => 'asc'],
            select: ['id', 'module_id', 'action', 'sort_order', 'is_active'],
            with: ['translations', 'module.translations'],
        );

        return $permissions
            ->groupBy('module_id')
            ->map(fn($items) => [
                'module'      => $items->first()->module,
                'permissions' => $items->values(),
            ])
            ->values()
            ->toArray();
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): Permission
    {
        $permission = $this->repository->first(
            where: ['id' => $id],
            with: ['translations', 'module.translations'],
            select: ['*'],
        );

        if (!$permission) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $permission;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * Tạo permission kèm translations.
     *
     * $data = [
     *   'module_id'   => 1,
     *   'action'      => 'view',   // view|create|update|delete
     *   'is_active'   => 1,
     *   'sort_order'  => 1,        // optional — tự sinh nếu thiếu
     *   'translations' => [
     *       ['locale' => 'vi', 'name' => 'Xem CLB'],
     *       ['locale' => 'en', 'name' => 'View Club'],
     *   ],
     * ]
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

        return $this->repository->createWithTranslations($data, $translations);
    }

    /**
     * Cập nhật permission kèm translations (upsert theo locale).
     */
    public function update(int $id, array $data): Permission
    {
        $permission = $this->find($id);

        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        if (isset($data['sort_order']) && $data['sort_order'] !== $permission->sort_order) {
            $this->repository->applySortOrder($data['sort_order'], $permission->id, $permission->sort_order);
        }

        return $this->repository->updateWithTranslations($permission, $data, $translations);
    }

    /**
     * Xoá permission và dịch chuyển sort_order.
     */
    public function delete(int $id): bool
    {
        return $this->deleteWithSortOrder($id);
    }

    /**
     * Toggle is_active 0|1.
     */
    public function toggleStatus(int $id): Permission
    {
        $permission = $this->find($id);
        $permission->is_active = !$permission->is_active;
        $permission->save();

        return $permission->fresh('translations');
    }
}

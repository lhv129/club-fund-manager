<?php

namespace App\Domains\Role\Services;

use App\Base\BaseService;
use App\Domains\Role\Models\Role;
use App\Domains\Role\Repositories\RoleRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class RoleService extends BaseService
{
    protected string $notFoundMessage = 'domains/role.not_found';

    public function __construct(RoleRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * GET /api/v1/roles  (phân trang)
     *
     * Params: search, club_id, is_active, sort_by, sort_dir, limit, page
     */
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $where   = $this->buildWhere($params, ['is_active']);
        $orderBy = $this->buildOrderBy($params, ['id', 'sort_order', 'created_at']);

        if (!empty($params['search'])) {
            $where['whereHas'] = [['translations', ['name' => ['name', 'like', $params['search']]]]];
        }

        return $this->repository->paginate(
            where: $where,
            orderBy: $orderBy,
            select: ['id','slug', 'sort_order', 'is_active', 'created_at'],
            with: ['translations'],
            limit: (int) ($params['limit'] ?? 0),
            page: (int) ($params['page'] ?? 1),
        );
    }

    /**
     * GET /api/v1/roles/select — dropdown list
     */
    public function getForSelect(array $params = []): Collection
    {
        $where = $this->buildWhere($params, ['club_id', 'is_active']);

        if (!empty($params['search'])) {
            $where['whereHas'] = [['translations', ['name' => ['name', 'like', $params['search']]]]];
        }

        return $this->repository->get(
            where: $where,
            orderBy: ['sort_order' => 'asc', 'id' => 'asc'],
            select: ['id', 'club_id', 'slug'],
            with: ['translations'],
            limit: min((int) ($params['limit'] ?? 50), 100),
        );
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): Role
    {
        $role = $this->repository->first(
            where: ['id' => $id],
            with: ['translations', 'permissions.translations'],
            select: ['*'],
        );

        if (!$role) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $role;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * Tạo role kèm translations và sync permissions.
     *
     * $data = [
     *   'club_id'        => 1,          // null = system role
     *   'slug'           => 'manager',
     *   'is_active'      => 1,
     *   'sort_order'     => 1,          // optional — tự sinh nếu thiếu
     *   'permission_ids' => [1, 2, 3],  // optional
     *   'translations'   => [
     *       ['locale' => 'vi', 'name' => 'Quản lý', 'description' => '...'],
     *       ['locale' => 'en', 'name' => 'Manager',  'description' => '...'],
     *   ],
     * ]
     */
    public function create(array $data): Role
    {
        $translations  = $data['translations'] ?? [];
        $permissionIds = $data['permission_ids'] ?? [];
        unset($data['translations'], $data['permission_ids']);

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        } else {
            $this->repository->applySortOrder($data['sort_order']);
        }

        $role = $this->repository->createWithTranslations($data, $translations);

        if (!empty($permissionIds)) {
            $this->repository->syncPermissions($role, $permissionIds);
        }

        return $role->load(['translations', 'permissions.translations']);
    }

    /**
     * Cập nhật role kèm translations và sync permissions.
     */
    public function update(int $id, array $data): Role
    {
        $role = $this->find($id);

        $translations  = $data['translations'] ?? [];
        $permissionIds = array_key_exists('permission_ids', $data) ? $data['permission_ids'] : null;
        unset($data['translations'], $data['permission_ids']);

        if (isset($data['sort_order']) && $data['sort_order'] !== $role->sort_order) {
            $this->repository->applySortOrder($data['sort_order'], $role->id, $role->sort_order);
        }

        $role = $this->repository->updateWithTranslations($role, $data, $translations);

        // Chỉ sync nếu client gửi permission_ids (dù rỗng cũng sync)
        if ($permissionIds !== null) {
            $this->repository->syncPermissions($role, $permissionIds);
        }

        return $role->load(['translations', 'permissions.translations']);
    }

    /**
     * Xoá role và dịch chuyển sort_order.
     */
    public function delete(int $id): bool
    {
        return $this->deleteWithSortOrder($id);
    }

    /**
     * Toggle is_active 0|1.
     */
    public function toggleStatus(int $id): Role
    {
        $role = $this->find($id);
        $role->is_active = !$role->is_active;
        $role->save();

        return $role->fresh('translations');
    }

    /**
     * POST /api/v1/roles/{id}/permissions
     * Sync toàn bộ permission_ids cho role.
     */
    public function syncPermissions(int $id, array $permissionIds): Role
    {
        $role = $this->find($id);
        $this->repository->syncPermissions($role, $permissionIds);

        return $role->load(['translations', 'permissions.translations']);
    }
}

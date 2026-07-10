<?php

namespace App\Domains\Role\Repositories;

use App\Base\BaseRepository;
use App\Domains\Role\Models\Role;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class RoleRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Role $model)
    {
        parent::__construct($model);
    }

    // -------------------------------------------------------------------------
    // Permissions sync
    // -------------------------------------------------------------------------

    /**
     * Sync permissions cho role.
     *
     * Vì role_permissions có is_active + softDeletes (không phải pivot đơn giản):
     *   - Permissions mới          → insert với is_active = true
     *   - Permissions bị bỏ       → soft delete (deleted_at = now)
     *   - Permissions đã có       → restore nếu đang soft-deleted, giữ nguyên nếu active
     *
     * @param Role  $role
     * @param int[] $permissionIds  danh sách permission_id muốn giữ lại
     */
    public function syncPermissions(Role $role, array $permissionIds): void
    {
        DB::transaction(function () use ($role, $permissionIds) {
            $roleId = $role->id;
            $now    = now();

            // 1. Lấy tất cả role_permissions hiện tại (kể cả đã soft-delete)
            $existing = DB::table('role_permissions')
                ->where('role_id', $roleId)
                ->get()
                ->keyBy('permission_id');

            $existingIds = $existing->keys()->map(fn($id) => (int) $id)->all();
            $newIds      = array_map('intval', $permissionIds);

            $toAdd    = array_diff($newIds, $existingIds);          // thêm mới
            $toRemove = array_diff($existingIds, $newIds);          // soft delete
            $toKeep   = array_intersect($existingIds, $newIds);     // restore nếu cần

            // 2. Insert mới
            if (!empty($toAdd)) {
                $insertRows = array_map(fn($pid) => [
                    'role_id'       => $roleId,
                    'permission_id' => $pid,
                    'is_active'     => true,
                    'created_at'    => $now,
                    'updated_at'    => $now,
                    'deleted_at'    => null,
                ], $toAdd);

                DB::table('role_permissions')->insert($insertRows);
            }

            // 3. Soft delete bỏ đi
            if (!empty($toRemove)) {
                DB::table('role_permissions')
                    ->where('role_id', $roleId)
                    ->whereIn('permission_id', $toRemove)
                    ->whereNull('deleted_at')
                    ->update(['deleted_at' => $now, 'updated_at' => $now]);
            }

            // 4. Restore những cái đang soft-deleted nhưng cần giữ lại
            if (!empty($toKeep)) {
                DB::table('role_permissions')
                    ->where('role_id', $roleId)
                    ->whereIn('permission_id', $toKeep)
                    ->whereNotNull('deleted_at')
                    ->update(['deleted_at' => null, 'is_active' => true, 'updated_at' => $now]);
            }
        });
    }

    // -------------------------------------------------------------------------
    // Query mở rộng
    // -------------------------------------------------------------------------

    /**
     * Lấy role kèm full permissions đang active (không soft-deleted).
     * Dùng khi cần kiểm tra quyền của user.
     */
    public function findWithActivePermissions(int $id): ?Model
    {
        return $this->model
            ->with([
                'translations',
                'permissions' => fn($q) => $q
                    ->wherePivotNull('deleted_at')
                    ->wherePivot('is_active', true)
                    ->with('translations'),
            ])
            ->find($id);
    }
}

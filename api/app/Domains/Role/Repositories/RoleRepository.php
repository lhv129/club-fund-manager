<?php

namespace App\Domains\Role\Repositories;

use App\Base\BaseRepository;
use App\Domains\Module\Models\Module;
use App\Domains\Role\Models\Role;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class RoleRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'sort_order';

    protected string $defaultOrderDirection = 'asc';

    protected array $allowedSortColumns = [
        'id',
        'sort_order',
        'created_at',
    ];

    protected array $selectColumns = [
        'id',
        'slug',
    ];

    public function __construct(Role $model)
    {
        parent::__construct($model);
    }

    /**
     * Query cơ sở.
     */
    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'slug',
                'is_active',
                'sort_order',
                'created_at',
            ])
            ->with('translations')
            ->withCount('permissions');
    }

    /**
     * Search theo translations.name
     */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (empty($filters['search'])) {
            return;
        }

        $search = $filters['search'];

        $query->whereHas('translations', function ($q) use ($search) {
            $q->where('name', 'like', "%{$search}%");
        });
    }

    /**
     * Filter.
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);
    }

    /**
     * Dropdown.
     */
    public function getForSelect(array $filters = []): Collection
    {
        $query = $this->baseListQuery();

        $this->applySearch($query, $filters);
        $this->applyFilters($query, $filters);

        return $query
            ->orderBy('sort_order')
            ->orderBy('id')
            ->limit(min((int)($filters['limit'] ?? 50), 100))
            ->get($this->selectColumns);
    }

    /**
     * Active permissions.
     */
    public function findWithActivePermissions(int $id): ?Model
    {
        return $this->model
            ->with([
                'translations',
                'permissions' => fn($q)
                => $q
                    ->wherePivotNull('deleted_at')
                    ->wherePivot('is_active', true)
                    ->with('translations')
            ])
            ->find($id);
    }

    /**
     * Danh sách permissions theo module, kèm checked theo role.
     * Trả về cấu trúc: [{module_id, module, label, actions: [{id, name, checked}]}].
     * Trả về null khi không tìm thấy role (để Service throw 404).
     */
    public function getPermissionsBySlug(string $slug): ?array
    {
        $role = $this->model
            ->where('slug', $slug)
            ->first(['id', 'slug']);

        if (!$role) {
            return null;
        }

        // Permission ids đang active của role.
        $rolePermissionIds = DB::table('role_permissions')
            ->where('role_id', $role->id)
            ->where('is_active', true)
            ->whereNull('deleted_at')
            ->pluck('permission_id')
            ->all();

        // Eager load `translation` (locale-scoped hasOne, tự dùng app()->getLocale()).
        $modules = Module::with([
            'translation',
            'permissions' => fn($q) => $q->orderBy('sort_order'),
        ])
            ->orderBy('sort_order')
            ->get();

        return $modules
            ->map(fn($module) => [
                'module_id' => $module->id,
                'module'    => $module->slug,
                'label'     => $module->translation?->name ?? $module->slug,
                'actions'   => $module->permissions
                    ->map(fn($p) => [
                        'id'      => $p->id,
                        'name'    => $p->action,
                        'checked' => in_array($p->id, $rolePermissionIds, true),
                    ])
                    ->values()
                    ->all(),
            ])
            ->values()
            ->all();
    }

    /**
     * Sync permissions.
     */
    public function syncPermissions(Role $role, array $permissionIds): void
    {
        DB::transaction(function () use ($role, $permissionIds) {

            $roleId = $role->id;

            $now = now();

            $existing = DB::table('role_permissions')
                ->where('role_id', $roleId)
                ->get()
                ->keyBy('permission_id');

            $existingIds = $existing->keys()->map(fn($id) => (int)$id)->all();

            $newIds = array_map('intval', $permissionIds);

            $toAdd = array_diff($newIds, $existingIds);

            $toRemove = array_diff($existingIds, $newIds);

            $toRestore = array_intersect($existingIds, $newIds);

            if ($toAdd) {

                DB::table('role_permissions')->insert(
                    array_map(fn($id) => [
                        'role_id' => $roleId,
                        'permission_id' => $id,
                        'is_active' => true,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ], $toAdd)
                );
            }

            if ($toRemove) {

                DB::table('role_permissions')
                    ->where('role_id', $roleId)
                    ->whereIn('permission_id', $toRemove)
                    ->whereNull('deleted_at')
                    ->update([
                        'deleted_at' => $now,
                        'updated_at' => $now,
                    ]);
            }

            if ($toRestore) {

                DB::table('role_permissions')
                    ->where('role_id', $roleId)
                    ->whereIn('permission_id', $toRestore)
                    ->whereNotNull('deleted_at')
                    ->update([
                        'deleted_at' => null,
                        'is_active' => true,
                        'updated_at' => $now,
                    ]);
            }
        });
    }
}

<?php

namespace App\Domains\Module\Repositories;

use App\Base\BaseRepository;
use App\Domains\Module\Models\Permission;
use Illuminate\Database\Eloquent\Collection;

class PermissionRepository extends BaseRepository
{
    protected string $defaultOrderBy        = 'sort_order';
    protected string $defaultOrderDirection = 'asc';

    public function __construct(Permission $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Read
    // ------------------------------------------------------------------

    /**
     * Tất cả permissions kèm module + translations — dùng cho matrix.
     */
    public function getAllWithModule(): Collection
    {
        return $this->model
            ->with(['module.translations'])
            ->orderBy('module_id')
            ->orderBy('sort_order')
            ->get();
    }

    /**
     * Permissions của 1 module (kể cả soft-deleted nếu withTrashed).
     */
    public function findByModuleId(int $moduleId, bool $withTrashed = false): Collection
    {
        $query = $this->model
            ->where('module_id', $moduleId)
            ->orderBy('sort_order');

        return $withTrashed ? $query->withTrashed()->get() : $query->get();
    }

    /**
     * Single permission by id.
     */
    public function findById(int $id): ?Permission
    {
        return $this->model
            ->with(['module.translations'])
            ->find($id);
    }

    // ------------------------------------------------------------------
    // Write
    // ------------------------------------------------------------------

    /**
     * Upsert 1 permission:
     *   trashed   → restore + is_active = 1
     *   exists    → update sort_order + is_active = 1
     *   not found → create
     */
    public function upsertPermission(int $moduleId, string $action): Permission
    {
        $existing = $this->model
            ->withTrashed()
            ->where('module_id', $moduleId)
            ->where('action', trim($action))
            ->first();

        if ($existing) {
            if ($existing->trashed()) {
                $existing->restore();
            }
            $existing->update([
                'sort_order' => $this->actionSortOrder($action),
                'is_active'  => 1,
            ]);
            return $existing->fresh();
        }

        return $this->model->create([
            'module_id'  => $moduleId,
            'action'     => trim($action),
            'sort_order' => $this->actionSortOrder($action),
            'is_active'  => 1,
        ]);
    }

    /**
     * Sync actions của module:
     *   có trong list → upsert / restore
     *   không còn    → soft delete
     */
    public function syncForModule(int $moduleId, array $actions): void
    {
        foreach ($actions as $action) {
            $this->upsertPermission($moduleId, $action);
        }

        $this->model
            ->where('module_id', $moduleId)
            ->whereNotIn('action', $actions)
            ->each(fn(Permission $p) => $p->delete());
    }

    /**
     * Soft delete toàn bộ permissions của 1 module.
     */
    public function softDeleteByModuleId(int $moduleId): void
    {
        $this->model
            ->where('module_id', $moduleId)
            ->each(fn(Permission $p) => $p->delete());
    }

    // ------------------------------------------------------------------
    // Helpers
    // ------------------------------------------------------------------

    public function actionSortOrder(string $action): int
    {
        return match ($action) {
            'view'   => 1,
            'create' => 2,
            'update' => 3,
            'delete' => 4,
            default  => 99,
        };
    }
}

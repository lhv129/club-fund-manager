<?php

namespace App\Domains\Module\Services;

use App\Base\BaseService;
use App\Domains\Module\Models\Module;
use App\Domains\Module\Repositories\ModuleRepository;
use App\Domains\Module\Repositories\PermissionRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ModuleService extends BaseService
{
    protected string $notFoundMessage = 'domains/module.not_found';

    public function __construct(
        ModuleRepository $repository,
        protected PermissionRepository $permissionRepository,
    ) {
        parent::__construct($repository);
    }

    // ------------------------------------------------------------------
    // Read
    // ------------------------------------------------------------------

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->paginateModule($filters);
    }

    public function getForSelect(array $filters = []): Collection
    {
        return $this->repository->getForSelect($filters);
    }

    public function find($id)
    {
        $module = $this->repository->findById($id);

        if (!$module) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $module;
    }

    // ------------------------------------------------------------------
    // Write
    // ------------------------------------------------------------------

    /**
     * Tạo module + translations + permissions trong 1 transaction.
     *
     * $data = [
     *   'slug'         => 'user',
     *   'sort_order'   => null,
     *   'is_active'    => true,
     *   'translations' => ['vi' => ['name' => 'Người dùng'], 'en' => ['name' => 'User']],
     *   'actions'      => ['view', 'create', 'update', 'delete'],
     * ]
     */
    public function create(array $data): Module
    {
        $translations = $data['translations'] ?? [];
        $actions      = $data['actions'];

        unset($data['translations'], $data['actions']);

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        } else {
            $this->repository->applySortOrder((int) $data['sort_order']);
        }

        $module = DB::transaction(function () use ($data, $translations, $actions) {
            // 1. Tạo module + translations
            $module = $this->repository->createWithTranslations($data, $translations);

            // 2. Tạo permissions mặc định
            foreach ($actions as $action) {
                $this->permissionRepository->upsertPermission($module->id, $action);
            }

            return $module;
        });

        return $this->find($module->id);
    }

    /**
     * Cập nhật module + translations.
     * Không sync permissions ở đây — dùng PUT /permissions/{id}.
     */
    public function update(int $id, array $data): Module
    {
        $module       = $this->find($id);
        $translations = $data['translations'] ?? [];
        $actions      = $data['actions'] ?? null;

        unset($data['translations'], $data['actions']);

        if (isset($data['sort_order']) && (int) $data['sort_order'] !== $module->sort_order) {
            $this->repository->applySortOrder(
                (int) $data['sort_order'],
                $module->id,
                $module->sort_order,
            );
        }

        DB::transaction(function () use ($module, $data, $translations, $actions) {
            $this->repository->updateWithTranslations($module, $data, $translations);

            if ($actions !== null) {
                $this->permissionRepository->syncForModule($module->id, $actions);
            }
        });

        return $this->find($id);
    }

    public function delete(int $id): bool
    {
        $module = $this->find($id);

        DB::transaction(function () use ($module, $id) {

            if (isset($module->sort_order)) {
                $this->repository->decrementSortOrderAfterDelete(
                    $module->sort_order,
                    $id
                );
            }

            // Soft delete permissions
            $module->permissions()->delete();

            // Xóa translations
            $module->translations()->delete();

            // Soft delete module
            $this->repository->delete($module);
        });

        return true;
    }

    public function toggleStatus(int $id): Module
    {
        $module            = $this->find($id);
        $module->is_active = !$module->is_active;
        $module->save();

        return $this->find($id);
    }
}

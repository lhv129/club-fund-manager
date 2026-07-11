<?php

namespace App\Domains\Module\Services;

use App\Base\BaseService;
use App\Domains\Module\Models\Module;
use App\Domains\Module\Repositories\ModuleRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ModuleService extends BaseService
{
    protected string $notFoundMessage = 'domains/module.not_found';

    public function __construct(ModuleRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * GET /api/v1/modules  (phân trang)
     *
     * Params: search, is_active, sort_by, sort_dir, limit, page
     */
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $where   = $this->buildWhere($params, ['is_active']);
        $orderBy = $this->buildOrderBy($params, ['id', 'sort_order', 'created_at']);

        if (!empty($params['search'])) {
            $where += $this->buildSearchWhere($params, ['slug']);
            // tìm thêm theo tên translation
            $where['whereHas'][] = ['translations', ['name' => ['name', 'like', $params['search']]]];
        }

        return $this->repository->paginate(
            where: $where,
            orderBy: $orderBy,
            select: ['id', 'slug', 'sort_order', 'is_active', 'created_at'],
            with: ['translations'],
            limit: (int) ($params['limit'] ?? 0),
            page: (int) ($params['page'] ?? 1),
        );
    }

    /**
     * GET /api/v1/modules/select — dropdown list
     */
    public function getForSelect(array $params = []): Collection
    {
        $where = $this->buildWhere($params, ['is_active']);

        if (!empty($params['search'])) {
            $where['whereHas'] = [['translations', ['name' => ['name', 'like', $params['search']]]]];
        }

        return $this->repository->get(
            where: $where,
            orderBy: ['sort_order' => 'asc', 'id' => 'asc'],
            select: ['id', 'slug', 'icon'],
            with: ['translations'],
            limit: min((int) ($params['limit'] ?? 50), 100),
        );
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): Module
    {
        $module = $this->repository->first(
            where: ['id' => $id],
            with: ['translations', 'permissions.translations'],
            select: ['*'],
        );

        if (!$module) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $module;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * Tạo module kèm translations.
     *
     * $data = [
     *   'slug'        => 'club-management',
     *   'icon'        => 'icon-club',
     *   'is_active'   => 1,
     *   'sort_order'  => 1,       // optional — tự sinh nếu thiếu
     *   'translations' => [
     *       ['locale' => 'vi', 'name' => 'Quản lý CLB', 'description' => '...'],
     *       ['locale' => 'en', 'name' => 'Club Management', 'description' => '...'],
     *   ],
     * ]
     */
    public function create(array $data): Module
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
     * Cập nhật module kèm translations (upsert theo locale).
     */
    public function update(int $id, array $data): Module
    {
        $module = $this->find($id);

        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        if (isset($data['sort_order']) && $data['sort_order'] !== $module->sort_order) {
            $this->repository->applySortOrder($data['sort_order'], $module->id, $module->sort_order);
        }

        return $this->repository->updateWithTranslations($module, $data, $translations);
    }

    /**
     * Xoá module và dịch chuyển sort_order.
     */
    public function delete(int $id): bool
    {
        return $this->deleteWithSortOrder($id);
    }

    /**
     * Toggle is_active 0|1.
     */
    public function toggleStatus(int $id): Module
    {
        $module = $this->find($id);
        $module->is_active = !$module->is_active;
        $module->save();

        return $module->fresh('translations');
    }
}

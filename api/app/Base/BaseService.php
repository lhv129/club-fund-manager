<?php

namespace App\Base;

use App\Exceptions\ApiException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Auth;

abstract class BaseService
{
    protected object $repository;

    protected string $notFoundMessage = 'exception.not_found';

    public function __construct(object $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Domain Service phải override method này.
     * Base không tự build where/orderBy vì không biết schema từng domain.
     */
    public function paginate(array $params = [])
    {
        throw new \LogicException(static::class . '::paginate() phải được override ở domain Service.');
    }

    public function cursorPaginate(array $params = [])
    {
        throw new \LogicException(static::class . '::cursorPaginate() phải được override ở domain Service.');
    }

    public function getActive()
    {
        return $this->repository->getActive();
    }

    public function find($id)
    {
        $data = $this->repository->find($id);

        if (!$data) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $data;
    }

    /**
     * Tìm 1 bản ghi theo điều kiện bất kỳ
     *
     * @param array $conditions  dùng được mọi cú pháp applyConditions()
     * @param array $select      mặc định ['*']
     * @param array $with        eager load relations
     * @param bool  $orFail      true → throw 404 | false → trả null
     */
    public function findByConditions(
        array $conditions,
        array $select  = ['*'],
        array $with    = [],
        bool  $orFail  = true
    ): mixed {
        $data = $this->repository->first(
            where: $conditions,
            select: $select,
            with: $with,
        );

        if (!$data && $orFail) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $data;
    }

    public function create(array $data)
    {
        return $this->repository->create($data);
    }

    public function bulkInsert(array $data)
    {
        return $this->repository->bulkInsert($data);
    }

    public function update(int $id, array $data)
    {
        $record = $this->find($id);
        return $this->repository->update($record, $data);
    }

    public function delete(int $id)
    {
        $data = $this->find($id);
        return $this->repository->delete($data);
    }

    public function deleteWithSortOrder(int $id)
    {
        $data = $this->find($id);

        DB::beginTransaction();

        try {
            if (isset($data->sort_order)) {
                $this->repository->decrementSortOrderAfterDelete(
                    $data->sort_order,
                    $id
                );
            }

            $this->repository->delete($data);

            DB::commit();

            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Toggle is_active 0|1.
     * Domain Service override nếu dùng status string thay vì is_active.
     */
    public function toggleStatus(int $id)
    {
        $model = $this->find($id);

        $model->is_active = !$model->is_active;
        $model->save();

        return $model->fresh();
    }

    /**
     * Build orderBy từ request params
     *
     * FIX: bỏ $this->defaultOrderBy (không tồn tại trên Service)
     *      fallback về 'id' khi sort_by không được truyền
     */
    protected function buildOrderBy(
        array $params,
        array $allowedColumns = []
    ): array {
        if (empty($params['sort_by']) && empty($params['sort_dir'])) {
            return []; // không có gì → repository dùng default của nó
        }

        $column = $params['sort_by'] ?? 'id';

        if (
            !empty($allowedColumns) &&
            !empty($params['sort_by']) &&
            !in_array($column, $allowedColumns)
        ) {
            $column = 'id';
        }

        $direction = strtolower($params['sort_dir'] ?? 'desc');
        if (!in_array($direction, ['asc', 'desc'])) {
            $direction = 'desc';
        }

        $orderBy = [$column => $direction];

        if ($column !== 'id') {
            $orderBy['id'] = $direction;
        }

        return $orderBy;
    }

    /**
     * Build mảng where cho simple equality filters từ params
     *
     * FIX: dùng isset + !== '' thay vì !empty()
     *      để không bỏ qua giá trị falsy như 0, false, '0'
     */
    protected function buildWhere(array $params, array $filterKeys = []): array
    {
        $where = [];

        foreach ($filterKeys as $key) {
            if (isset($params[$key]) && $params[$key] !== '' && $params[$key] !== null) {
                $where[$key] = $params[$key];
            }
        }

        return $where;
    }

    /**
     * Build search orWhere theo nhiều cột
     */
    protected function buildSearchWhere(array $params, array $columns): array
    {
        if (empty($params['search'])) {
            return [];
        }

        $orWhere = [];

        foreach ($columns as $column) {
            $orWhere[$column] = [$column, 'like', $params['search']];
        }

        return ['orWhere' => $orWhere];
    }

    protected function authorizeAction(string $ability, $model, $user = null)
    {
        $user = $user ?? Auth::user();

        if (Gate::forUser($user)->denies($ability, $model)) {
            throw new ApiException('Bạn không có quyền thực hiện thao tác này.', 403);
        }
    }
}

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

    // -------------------------------------------------------------------------
    // List — default delegate xuống Repository, override nếu cần phân quyền
    // -------------------------------------------------------------------------

    /**
     * Offset pagination — delegate xuống repository->getList().
     * Domain Service override nếu cần phân quyền (vd: admin vs user).
     */
    public function paginate(array $filters = [])
    {
        return $this->repository->getList($filters);
    }

    /**
     * Cursor pagination — delegate xuống repository->getCursorList().
     * Domain Service override nếu cần logic đặc thù.
     */
    public function cursorPaginate(array $filters = [])
    {
        return $this->repository->getCursorList($filters);
    }

    /**
     * Dropdown / select list — delegate xuống repository->getForSelect().
     * Domain Service override nếu cần lọc thêm quyền.
     */
    public function getForSelect(array $filters = [])
    {
        return $this->repository->getForSelect($filters);
    }

    /**
     * Đếm theo filter — delegate xuống repository->countFiltered().
     */
    public function count(array $filters = []): int
    {
        return $this->repository->countFiltered($filters);
    }

    // -------------------------------------------------------------------------
    // Read
    // -------------------------------------------------------------------------

    public function getActive()
    {
        return $this->repository->getActive();
    }

    /**
     * Tìm 1 bản ghi theo ID, throw 404 nếu không tìm thấy.
     */
    public function find($id)
    {
        $data = $this->repository->find($id);

        if (!$data) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $data;
    }

    /**
     * Tìm 1 bản ghi theo điều kiện bất kỳ.
     *
     * @param array $conditions  ['field' => 'value', ...]
     * @param array $select
     * @param array $with
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

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

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

    /**
     * Xóa + dồn lại sort_order trong 1 transaction.
     */
    public function deleteWithSortOrder(int $id): bool
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

    // -------------------------------------------------------------------------
    // Authorization
    // -------------------------------------------------------------------------

    protected function authorizeAction(string $ability, $model, $user = null): void
    {
        $user = $user ?? Auth::user();

        if (Gate::forUser($user)->denies($ability, $model)) {
            throw new ApiException('Bạn không có quyền thực hiện thao tác này.', 403);
        }
    }
}

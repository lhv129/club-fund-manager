<?php

namespace App\Domains\Bank\Services;

use App\Base\BaseService;
use App\Domains\Bank\Models\Bank;
use App\Domains\Bank\Repositories\BankRepository;
use App\Exceptions\ApiException;
use App\Helpers\ImageHelper;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BankService extends BaseService
{
    protected string $notFoundMessage = 'domains/bank.not_found';

    protected object $repository;

    public function __construct(BankRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): Bank
    {
        $bank = parent::find($id);

        if (!$bank) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $bank;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(array $data): Bank
    {
        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        } else {
            $this->repository->applySortOrder((int) $data['sort_order']);
        }

        if (!empty($data['logo'])) {
            $data['logo'] = ImageHelper::uploadSingle(
                file: $data['logo'],
                folder: 'banks'
            );
        }

        return $this->repository->create($data);
    }

    public function update(int $id, array $data): Bank
    {
        $bank = $this->find($id);

        if (!empty($data['logo'])) {
            $data['logo'] = ImageHelper::uploadSingle(
                file: $data['logo'],
                folder: 'banks',
                oldFile: $bank->logo,
            );
        } else {
            unset($data['logo']);
        }

        if (
            isset($data['sort_order']) &&
            (int) $data['sort_order'] !== (int) $bank->sort_order
        ) {
            $this->repository->applySortOrder(
                (int) $data['sort_order'],
                $bank->id,
                $bank->sort_order
            );
        }

        return parent::update($id, $data);
    }

    public function delete(int $id): bool
    {
        $bank = $this->find($id);

        $result = $this->deleteWithSortOrder($id);

        if ($result && $bank->logo) {
            ImageHelper::delete($bank->logo);
        }

        return $result;
    }

    public function toggleStatus(int $id): Bank
    {
        $bank = $this->find($id);

        $bank->is_active = !$bank->is_active;
        $bank->save();

        return $bank->fresh();
    }
}

<?php

namespace App\Domains\Bank\Controllers;

use App\Base\BaseController;
use App\Domains\Bank\Requests\FilterBankAccountRequest;
use App\Domains\Bank\Requests\StoreBankAccountRequest;
use App\Domains\Bank\Requests\UpdateBankAccountRequest;
use App\Domains\Bank\Resources\BankAccountResource;
use App\Domains\Bank\Services\BankAccountService;
use Illuminate\Http\JsonResponse;

class BankAccountController extends BaseController
{
    public function __construct(protected BankAccountService $service) {}

    /**
     * GET /api/v1/bank-accounts?search=abc&is_active=1&user_id=2&sort_by=title&sort_dir=asc&limit=20&page=1
     */
    public function index(FilterBankAccountRequest $request): JsonResponse
    {
        $filters = $request->validated();

        $filters['club_id'] = $request->attributes->get('club_id');

        return $this->paginateResponse(
            $this->service->paginate($filters),
            __('domains/bank_account.list'),
            BankAccountResource::class,
        );
    }

    /**
     * POST /api/v1/bank-accounts
     */
    public function store(StoreBankAccountRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['club_id'] = $request->attributes->get('club_id');

        return $this->responseCommon(
            true,
            __('domains/bank_account.created'),
            new BankAccountResource($this->service->create($data)),
            201,
        );
    }

    /**
     * PUT /api/v1/bank-accounts/{id}
     */
    public function update(UpdateBankAccountRequest $request, string $clubSlug, int $id): JsonResponse
    {
        $data = $request->validated();
        $data['club'] = $request->attributes->get('club');
        return $this->responseCommon(
            true,
            __('domains/bank_account.updated'),
            new BankAccountResource($this->service->update($id, $data)),
        );
    }

    /**
     * DELETE /api/v1/bank-accounts/{id} — xoá mềm + dồn sort_order.
     */
    public function destroy(string $clubSlug, int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/bank_account.deleted'));
    }

    /**
     * POST /api/v1/bank-accounts/{id}/toggle-status
     */
    public function toggleStatus(string $clubSlug, int $id): JsonResponse
    {
        $bankAccount = $this->service->toggleStatus($id);
        return $this->responseCommon(true, $bankAccount->is_active ? __('domains/bank_account.status_activated') : __('domains/bank_account.status_deactivated'), new BankAccountResource($bankAccount));
    }

    /**
     * POST /api/v1/bank-accounts/{id}/toggle-default
     */
    public function toggleDefault(string $clubSlug, int $id): JsonResponse
    {
        $bankAccount = $this->service->toggleDefault($id);

        return $this->responseCommon(
            true,
            $bankAccount->is_default
                ? __('domains/bank_account.default_set')
                : __('domains/bank_account.default_unset'),
            new BankAccountResource($bankAccount),
        );
    }
}

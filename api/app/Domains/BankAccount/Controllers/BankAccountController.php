<?php

namespace App\Domains\BankAccount\Controllers;

use App\Base\BaseController;
use App\Domains\BankAccount\Requests\FilterBankAccountRequest;
use App\Domains\BankAccount\Requests\ReorderBankAccountRequest;
use App\Domains\BankAccount\Requests\StoreBankAccountRequest;
use App\Domains\BankAccount\Requests\UpdateBankAccountRequest;
use App\Domains\BankAccount\Resources\BankAccountResource;
use App\Domains\BankAccount\Services\BankAccountService;
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
     * PATCH /api/v1/bank-accounts/{id}/toggle-status
     */
    public function toggleStatus(string $clubSlug, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank_account.status_toggled'),
            new BankAccountResource($this->service->toggleStatus($id)),
        );
    }

    /**
     * POST /api/v1/bank-accounts/reorder — kéo thả sort_order.
     * Body: [{ id: 1, sort_order: 2 }, { id: 2, sort_order: 1 }]
     */
    public function reorder(ReorderBankAccountRequest $request): JsonResponse
    {
        $this->service->reorder($request->validated());

        return $this->responseCommon(true, __('domains/bank_account.reordered'));
    }
}

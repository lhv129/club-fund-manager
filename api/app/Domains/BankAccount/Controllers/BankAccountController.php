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
use Illuminate\Http\Request;
use Tymon\JWTAuth\Facades\JWTAuth;

class BankAccountController extends BaseController
{
    public function __construct(protected BankAccountService $service) {}

    /**
     * GET /api/v1/bank-accounts?search=abc&is_active=1&user_id=2&sort_by=title&sort_dir=asc&limit=20&page=1
     */
    public function index(FilterBankAccountRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/bank_account.list'),
            BankAccountResource::class,
        );
    }

    /**
     * GET /api/v1/bank-accounts/cursor?limit=10&cursor=eyJpZCI6MTAwfQ
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        return $this->cursorResponse(
            $this->service->cursorPaginate($request->only(['limit', 'search', 'is_active', 'user_id'])),
            __('domains/bank_account.list'),
            BankAccountResource::class,
        );
    }

    /**
     * GET /api/v1/bank-accounts/select — dropdown, không Resource, không phân trang.
     */
    public function select(Request $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank_account.select'),
            $this->service->getForSelect($request->only(['search', 'is_active', 'user_id', 'limit'])),
        );
    }

    /**
     * GET /api/v1/bank-accounts/slug/{slug}
     */
    public function showBySlug(string $slug): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank_account.detail'),
            new BankAccountResource($this->service->findBySlug($slug)),
        );
    }

    /**
     * GET /api/v1/bank-accounts/{id}
     */
    public function show(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank_account.detail'),
            new BankAccountResource($this->service->findWithRelations($id, ['user'])),
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
    public function update(UpdateBankAccountRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank_account.updated'),
            new BankAccountResource($this->service->update($id, $request->validated())),
        );
    }

    /**
     * DELETE /api/v1/bank-accounts/{id} — xoá mềm + dồn sort_order.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/bank_account.deleted'));
    }

    /**
     * PATCH /api/v1/bank-accounts/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
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

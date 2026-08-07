<?php

namespace App\Domains\Bank\Controllers;

use App\Base\BaseController;
use App\Domains\Bank\Requests\FilterBankRequest;
use App\Domains\Bank\Requests\StoreBankRequest;
use App\Domains\Bank\Requests\UpdateBankRequest;
use App\Domains\Bank\Resources\BankResource;
use App\Domains\Bank\Services\BankService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BankController extends BaseController
{
    public function __construct(protected BankService $service) {}

    /**
     * GET /api/v1/banks
     */
    public function index(FilterBankRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/bank.list'),
            BankResource::class,
        );
    }

    /**
     * GET /api/v1/banks/cursor
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        return $this->cursorResponse(
            $this->service->cursorPaginate(
                $request->only([
                    'limit',
                    'search',
                    'is_active',
                ])
            ),
            __('domains/bank.list'),
            BankResource::class,
        );
    }

    /**
     * GET /api/v1/banks/select
     */
    public function select(Request $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank.select'),
            $this->service->getForSelect(
                $request->only([
                    'search',
                    'is_active',
                    'limit',
                ])
            ),
        );
    }

    /**
     * GET /api/v1/banks/{id}
     */
    public function show(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank.detail'),
            new BankResource($this->service->find($id)),
        );
    }

    /**
     * POST /api/v1/banks
     */
    public function store(StoreBankRequest $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank.created'),
            new BankResource(
                $this->service->create($request->validated())
            ),
            201,
        );
    }

    /**
     * PUT /api/v1/banks/{id}
     */
    public function update(UpdateBankRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank.updated'),
            new BankResource(
                $this->service->update($id, $request->validated())
            ),
        );
    }

    /**
     * DELETE /api/v1/banks/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->delete($id);

        return $this->responseCommon(
            true,
            __('domains/bank.deleted')
        );
    }

    /**
     * PATCH /api/v1/banks/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/bank.status_toggled'),
            new BankResource(
                $this->service->toggleStatus($id)
            ),
        );
    }
}

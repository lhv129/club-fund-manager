<?php

namespace App\Domains\Transaction\Controllers;

use App\Base\BaseController;
use App\Domains\Transaction\Requests\FilterTransactionRequest;
use App\Domains\Transaction\Requests\UpdateTransactionRequest;
use App\Domains\Transaction\Resources\TransactionResource;
use App\Domains\Transaction\Services\TransactionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends BaseController
{
    public function __construct(protected TransactionService $service) {}

    /**
     * GET /api/v1/transactions?search=abc&is_active=1&user_id=2&type=expense
     *   &from_date=2026-08-01&sort_by=transaction_date&sort_dir=asc&limit=20&page=1
     */
    public function index(FilterTransactionRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $filters['club_id'] = $request->attributes->get('club_id');

        return $this->paginateResponse(
            $this->service->paginate($filters),
            __('domains/transaction.list'),
            TransactionResource::class,
        );
    }

    /**
     * GET /api/v1/transactions/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/transaction.detail'),
            new TransactionResource(
                $this->service->findDetail(
                    $id,
                    (int) $request->attributes->get('club_id'),
                )
            ),
        );
    }

    /**
     * GET /api/v1/transactions/select
     */
    public function select(FilterTransactionRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $filters['club_id'] = $request->attributes->get('club_id');

        return $this->responseCommon(
            true,
            __('domains/transaction.list'),
            $this->service->getForSelect($filters),
        );
    }

    public function update(UpdateTransactionRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/transaction.updated'),
            new TransactionResource($this->service->updateForClub(
                $id,
                (int) $request->attributes->get('club_id'),
                $request->validated(),
            )),
        );
    }
}

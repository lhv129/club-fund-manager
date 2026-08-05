<?php

namespace App\Domains\Transaction\Controllers;

use App\Base\BaseController;
use App\Domains\Transaction\Requests\FilterTransactionRequest;
use App\Domains\Transaction\Resources\TransactionResource;
use App\Domains\Transaction\Services\TransactionService;
use Illuminate\Http\JsonResponse;


class TransactionController extends BaseController
{
    public function __construct(protected TransactionService $service) {}

    /**
     * GET /api/v1/transactions?search=abc&is_active=1&user_id=2&sort_by=transaction_date&sort_dir=asc&limit=20&page=1
     */
    public function index(FilterTransactionRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/transaction.list'),
            TransactionResource::class,
        );
    }

    
}

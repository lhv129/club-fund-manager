<?php

namespace App\Domains\MonthlyContribution\Controllers;

use App\Base\BaseController;
use App\Domains\MonthlyContribution\Requests\FilterMonthlyContributionRequest;
use App\Domains\MonthlyContribution\Requests\StoreMonthlyContributionRequest;
use App\Domains\MonthlyContribution\Requests\UpdateMonthlyContributionRequest;
use App\Domains\MonthlyContribution\Resources\MonthlyContributionResource;
use App\Domains\MonthlyContribution\Services\MonthlyContributionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MonthlyContributionController extends BaseController
{
    public function __construct(protected MonthlyContributionService $service) {}

    /**
     * GET /api/v1/monthly-contributions
     *     ?search=&period_id=1&status=pending&paid_by=bank&is_active=1
     *     &sort_by=payment_date&sort_dir=desc&limit=20&page=1
     */
    public function index(FilterMonthlyContributionRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $filters['club_id'] = $request->attributes->get('club_id');
        return $this->paginateResponse(
            $this->service->paginate($filters),
            __('domains/monthly_contribution.list'),
            MonthlyContributionResource::class,
        );
    }

    /**
     * GET /api/v1/monthly-contributions/cursor?limit=10&cursor=eyJpZCI6MTAwfQ
     */
    public function cursorIndex(FilterMonthlyContributionRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $filters['club_id'] = $request->attributes->get('club_id');

        return $this->cursorResponse(
            $this->service->cursorPaginate($filters),
            __('domains/monthly_contribution.list'),
            MonthlyContributionResource::class,
        );
    }

    /**
     * GET /api/v1/monthly-contributions/select — dropdown, không Resource, không phân trang.
     */
    public function select(FilterMonthlyContributionRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $filters['club_id'] = $request->attributes->get('club_id');

        return $this->responseCommon(
            true,
            __('domains/monthly_contribution.select'),
            $this->service->getForSelect($filters),
        );
    }

    /**
     * GET /api/v1/monthly-contributions/{id}
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $contribution = $this->service->findWithRelations(
            $id,
            [
                // User
                'user:id,fullname,email,gender',

                // Club
                'club:id,logo',
                'club.translations:id,club_id,locale,name,slug',

                // Fund Period
                'period:id,club_id,year,month,male_amount,female_amount,exchange_male_amount,exchange_female_amount,is_locked',

                // Payment Code
                'paymentCode:id,monthly_contribution_id,payment_code,status,expired_at,used_at',

                // Transaction
                'transaction:id,club_id,bank_account_id,source,type,amount,balance,reference_code,sender_name,sender_account,description,transaction_date',

                // Bank Account
                'transaction.bankAccount:id,bank_id,account_number,account_name,qr_image,is_default',

                // Bank
                'transaction.bankAccount.bank:id,name,code,logo',
            ],
            $request->attributes->get('club_id'),
        );

        return $this->responseCommon(
            true,
            __('domains/monthly_contribution.detail'),
            new MonthlyContributionResource($contribution),
        );
    }

    /**
     * POST /api/v1/monthly-contributions
     */
    public function store(StoreMonthlyContributionRequest $request): JsonResponse
    {
        $data = $request->validated();
        $data['club_id'] = $request->attributes->get('club_id');
        return $this->responseCommon(
            true,
            __('domains/monthly_contribution.created'),
            new MonthlyContributionResource($this->service->create($data)),
            201,
        );
    }

    /**
     * PUT /api/v1/monthly-contributions/{id}
     */
    public function update(UpdateMonthlyContributionRequest $request, int $id): JsonResponse
    {
        $data = $request->validated();
        $data['club_id'] = $request->attributes->get('club_id');

        return $this->responseCommon(
            true,
            __('domains/monthly_contribution.updated'),
            new MonthlyContributionResource(
                $this->service->update($id, $data)
            ),
        );
    }

    /**
     * DELETE /api/v1/monthly-contributions/{id} — xoá mềm + dồn sort_order.
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $this->service->deleteForClub(
            $id,
            $request->attributes->get('club_id'),
        );

        return $this->responseCommon(true, __('domains/monthly_contribution.deleted'));
    }
}

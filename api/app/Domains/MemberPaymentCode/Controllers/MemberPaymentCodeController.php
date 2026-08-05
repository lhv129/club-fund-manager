<?php

namespace App\Domains\MemberPaymentCode\Controllers;

use App\Base\BaseController;
use App\Domains\MemberPaymentCode\Requests\FilterMemberPaymentCodeRequest;
use App\Domains\MemberPaymentCode\Resources\MemberPaymentCodeResource;
use App\Domains\MemberPaymentCode\Services\MemberPaymentCodeService;
use Illuminate\Http\JsonResponse;

class MemberPaymentCodeController extends BaseController
{
    public function __construct(protected MemberPaymentCodeService $service) {}

    /**
     * GET /api/v1/payment-codes?status=pending&monthly_contribution_id=1&sort_by=created_at&sort_dir=desc&limit=20&page=1
     */
    public function index(FilterMemberPaymentCodeRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/member_payment_code.list'),
            MemberPaymentCodeResource::class,
        );
    }

    /**
     * GET /api/v1/payment-codes/{id}
     */
    public function show(string $clubSlug, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/member_payment_code.detail'),
            new MemberPaymentCodeResource($this->service->find($id)),
        );
    }

    /**
     * GET /api/v1/monthly-contributions/{contributionId}/payment-code
     * Lấy code đang active (pending & chưa hết hạn) của 1 contribution.
     */
    public function showForContribution(string $clubSlug, int $contributionId): JsonResponse
    {
        $code = $this->service->findForContribution($contributionId);

        if (!$code) {
            return $this->responseCommon(
                true,
                __('domains/member_payment_code.no_active_code'),
                null,
            );
        }

        return $this->responseCommon(
            true,
            __('domains/member_payment_code.detail'),
            new MemberPaymentCodeResource($code),
        );
    }

    /**
     * POST /api/v1/monthly-contributions/{contributionId}/payment-code
     * Sinh (hoặc làm mới) payment code cho contribution.
     */
    public function generateForContribution(string $clubSlug, int $contributionId): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/member_payment_code.generated'),
            new MemberPaymentCodeResource($this->service->generateForContribution($contributionId)),
            201,
        );
    }
}

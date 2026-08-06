<?php

namespace App\Domains\MemberPaymentCode\Controllers;

use App\Base\BaseController;
use App\Domains\MemberPaymentCode\Requests\FilterMemberPaymentCodeRequest;
use App\Domains\MemberPaymentCode\Resources\MemberPaymentCodeResource;
use App\Domains\MemberPaymentCode\Services\MemberPaymentCodeService;
use App\Domains\MonthlyContribution\Services\MonthlyContributionService;
use App\Exceptions\ApiException;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class MemberPaymentCodeController extends BaseController
{
    public function __construct(
        protected MemberPaymentCodeService $service,
        protected MonthlyContributionService  $contributionService,
) {

    }

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
     * POST /clubs/{clubSlug}/monthly-contributions/{id}/payment-code
     *
     * Sinh hoặc trả lại mã thanh toán cho contribution.
     * Chỉ chủ sở hữu contribution mới được gọi endpoint này.
     */
    public function generateOrReuse(string $clubSlug, int $id): JsonResponse
    {
        // 1. Lấy contribution (throw 404 nếu không tồn tại)
        $contribution = $this->contributionService->findWithRelations($id, []);
        // 2. Kiểm tra quyền sở hữu
        //    Admin của club đã được kiểm soát qua middleware perm.club,
        //    nên ở đây chỉ cần chặn trường hợp member xem của người khác.
        if (Auth::user()->id !== $contribution->user_id) {
            throw new ApiException(__('domains/member_payment_code.forbidden'), 403);
        }
        // 3. Generate hoặc trả lại code (idempotency + guard status bên trong)
        $code = $this->service->generateOrReuse($contribution);
        return $this->responseCommon(
            true,
            __('domains/member_payment_code.generated'),
            new MemberPaymentCodeResource($code),
        );
    }
}

<?php

namespace App\Domains\MemberPaymentCode\Controllers;

use App\Base\BaseController;
use App\Domains\MemberPaymentCode\Requests\FilterMemberPaymentCodeRequest;
use App\Domains\MemberPaymentCode\Resources\MemberPaymentCodeDetailResource;
use App\Domains\MemberPaymentCode\Resources\MemberPaymentCodePaymentResource;
use App\Domains\MemberPaymentCode\Resources\MemberPaymentCodeResource;
use App\Domains\MemberPaymentCode\Services\MemberPaymentCodeService;
use Illuminate\Http\JsonResponse;

class MemberPaymentCodeController extends BaseController
{
    public function __construct(
        protected MemberPaymentCodeService $service
    ) {}

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
     * GET /api/v1/payment-codes/{paymentCode}
     */
    public function getByPaymentCode(string $code): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/member_payment_code.detail'),
            new MemberPaymentCodeDetailResource($this->service->getByPaymentCode($code)),
        );
    }

    /**
     * POST /monthly-contributions/{id}/payment-code
     *
     * Sinh hoặc trả lại mã thanh toán.
     */
    public function generateOrReuse(int $id): JsonResponse
    {
        $payment = $this->service->generateOrReuse($id);

        return $this->responseCommon(
            true,
            __('domains/member_payment_code.generated'),
            new MemberPaymentCodePaymentResource($payment),
        );
    }
}

<?php

namespace App\Domains\MemberPaymentCode\Services;

use App\Base\BaseService;
use App\Domains\MemberPaymentCode\Models\MemberPaymentCode;
use App\Domains\MemberPaymentCode\Repositories\MemberPaymentCodeRepository;
use App\Domains\MonthlyContribution\Repositories\MonthlyContributionRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class MemberPaymentCodeService extends BaseService
{
    protected string $notFoundMessage = 'domains/member_payment_code.not_found';

    public function __construct(
        MemberPaymentCodeRepository $repository,
        protected MonthlyContributionRepository $contributionRepository,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): MemberPaymentCode
    {
        return parent::find($id);
    }

    public function findForContribution(int $contributionId): ?MemberPaymentCode
    {
        return $this->repository->findActiveForContribution($contributionId);
    }

    // -------------------------------------------------------------------------
    // Generate / Regenerate
    // -------------------------------------------------------------------------

    /**
     * Sinh (hoặc làm mới) payment code cho 1 MonthlyContribution.
     *
     * - Nếu đã có code pending & chưa hết hạn → trả về code cũ.
     * - Nếu có code pending đã hết hạn → đánh dấu expired rồi sinh code mới.
     * - Code: 8 ký tự in hoa [A-Z0-9], unique.
     * - expired_at: mặc định cuối ngày (23:59:59) + 30 ngày.
     */
    public function generateForContribution(int $contributionId): MemberPaymentCode
    {
        // Verify contribution tồn tại
        $contribution = $this->contributionRepository->find($contributionId);

        if (!$contribution) {
            throw new ApiException(__('domains/member_payment_code.contribution_not_found'), 404);
        }

        return DB::transaction(function () use ($contributionId) {
            // Hết hạn code pending cũ nếu đã quá hạn
            $this->repository->editWhere(
                where: [
                    'monthly_contribution_id' => $contributionId,
                    'status'                 => 'pending',
                ],
                data: ['status' => 'expired'],
            );

            // Sinh code unique 8 ký tự
            $code = $this->generateUniqueCode();

            return $this->repository->create([
                'monthly_contribution_id' => $contributionId,
                'payment_code'            => $code,
                'status'                  => 'pending',
                'expired_at'              => now()->addDays(30)->endOfDay(),
                'sort_order'              => $this->repository->getNextSortOrder(),
                'is_active'               => true,
            ]);
        });
    }

    /**
     * Sinh chuỗi 8 ký tự in hoa [A-Z0-9] unique trong bảng member_payment_codes.
     */
    private function generateUniqueCode(): string
    {
        $alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $code = '';
            for ($i = 0; $i < 8; $i++) {
                $code .= $alphabet[random_int(0, strlen($alphabet) - 1)];
            }

            if (!$this->repository->codeExists($code)) {
                return $code;
            }
        }

        // Fallback cực hiếm: thêm timestamp suffix
        return Str::upper(Str::random(6)) . substr((string) time(), -2);
    }
}

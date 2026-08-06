<?php

namespace App\Domains\MemberPaymentCode\Services;

use App\Base\BaseService;
use App\Domains\MemberPaymentCode\Models\MemberPaymentCode;
use App\Domains\MemberPaymentCode\Repositories\MemberPaymentCodeRepository;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\MonthlyContribution\Repositories\MonthlyContributionRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class MemberPaymentCodeService extends BaseService
{
    protected string $notFoundMessage = 'domains/member_payment_code.not_found';

    // Bảng ký tự không có O/0, I/1 để tránh nhầm lẫn khi đọc
    private const CODE_CHARS  = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    private const CODE_LENGTH = 8;

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
     * Trả về code đang pending chưa hết hạn, hoặc generate code mới.
     *
     * Guard:
     *   - contribution.status = paid      → 422
     *   - contribution.status = cancelled → 422
     *   - code pending chưa hết hạn tồn tại → trả lại, không tạo mới
     */
    public function generateOrReuse(MonthlyContribution $contribution): MemberPaymentCode
    {
        // ── Guard trạng thái contribution ────────────────────────────────────
        if ($contribution->status === 'paid') {
            throw new ApiException(__('domains/member_payment_code.already_paid'), 422);
        }
        if ($contribution->status === 'cancelled') {
            throw new ApiException(__('domains/member_payment_code.already_cancelled'), 422);
        }
        // ── Idempotency: trả lại code cũ nếu còn hiệu lực ──────────────────
        $existing = $this->repository->findActiveForContribution($contribution->id);
        if ($existing) {
            return $existing;
        }
        // ── Generate code mới ────────────────────────────────────────────────
        return DB::transaction(function () use ($contribution) {
            return $this->repository->create([
                'monthly_contribution_id' => $contribution->id,
                'payment_code'            => $this->generateUniqueCode(),
                'status'                  => 'pending',
                'expired_at'              => now()->endOfMonth()->endOfDay(),
                'sort_order'              => $this->repository->getNextSortOrder(),
                'is_active'               => true,
            ]);
        });
    }
    // ── Private helpers ──────────────────────────────────────────────────────
    private function generateUniqueCode(): string
    {
        $chars = self::CODE_CHARS;
        $len   = strlen($chars);
        do {
            $code = '';
            for ($i = 0; $i < self::CODE_LENGTH; $i++) {
                $code .= $chars[random_int(0, $len - 1)];
            }
        } while ($this->repository->codeExists($code));
        return $code;
    }
}

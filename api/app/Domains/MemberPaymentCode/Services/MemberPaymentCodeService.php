<?php

namespace App\Domains\MemberPaymentCode\Services;

use App\Base\BaseService;
use App\Domains\MemberPaymentCode\Models\MemberPaymentCode;
use App\Domains\MemberPaymentCode\Repositories\MemberPaymentCodeRepository;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\MonthlyContribution\Repositories\MonthlyContributionRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Domains\User\Models\User;
use App\Domains\Bank\Models\BankAccount;
use App\Domains\Bank\Repositories\BankAccountRepository;
use App\Domains\MemberPaymentCode\Data\MemberPaymentCodePaymentData;

class MemberPaymentCodeService extends BaseService
{
    protected string $notFoundMessage = 'domains/member_payment_code.not_found';

    // Bảng ký tự không có O/0, I/1 để tránh nhầm lẫn khi đọc
    private const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

    private const CODE_LENGTH = 8;

    public function __construct(
        MemberPaymentCodeRepository $repository,
        protected MonthlyContributionRepository $contributionRepository,
        protected BankAccountRepository $bankAccountRepository,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    public function paginate(
        array $filters = []
    ): LengthAwarePaginator {
        return $this->repository->getList($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find(int $id): MemberPaymentCode
    {
        return parent::find($id);
    }

    public function getByPaymentCode(
        string $code
    ) {
        return $this->repository
            ->findByPaymentCode($code);
    }

    // -------------------------------------------------------------------------
    // Generate / Regenerate
    // -------------------------------------------------------------------------

    /**
     * Sinh hoặc trả lại payment code cho contribution.
     *
     * Authorization:
     *
     * 1. Superadmin
     *    → luôn được phép.
     *
     * 2. System admin
     *    → phải có permission:
     *      member_payment_code.view
     *    ở SYSTEM scope.
     *
     * 3. User không phải system admin
     *    → phải có permission:
     *      member_payment_code.view
     *    ở CLUB scope.
     *
     * 4. Owner của contribution
     *    → được phép generate/reuse cho contribution
     *    của chính mình.
     *
     * Business rules:
     *
     * - paid      → không được generate.
     * - cancelled → không được generate.
     * - pending + chưa hết hạn → trả code cũ.
     * - không có code hợp lệ → tạo code mới.
     */
    public function generateOrReuse(
        int $contributionId
    ): MemberPaymentCodePaymentData {
        // ---------------------------------------------------------------------
        // 1. Load contribution
        // ---------------------------------------------------------------------

        $contribution =
            $this->contributionRepository
            ->find($contributionId);

        if (!$contribution) {
            throw new ApiException(
                __(
                    'domains/member_payment_code.contribution_not_found'
                ),
                404
            );
        }

        // ---------------------------------------------------------------------
        // 2. Authorization
        // ---------------------------------------------------------------------

        $this->authorizeGenerateOrReuse(
            $contribution
        );

        // ---------------------------------------------------------------------
        // 3. Business guard
        // ---------------------------------------------------------------------

        $this->validateContributionStatus(
            $contribution
        );

        // ---------------------------------------------------------------------
        // 4. Generate / reuse payment code
        // ---------------------------------------------------------------------

        $paymentCode = $this->repository->findActiveForContribution($contribution->id);

        if (!$paymentCode) {
            $paymentCode = DB::transaction(
                function () use ($contribution) {
                    return $this->repository->create([
                        'monthly_contribution_id' => $contribution->id,

                        'payment_code' => $this->generateUniqueCode(),

                        'status' => MemberPaymentCode::STATUS_PENDING,

                        'expired_at' =>now()->endOfMonth()->endOfDay(),
                        'is_active' => true,
                    ]);
                }
            );
        }

        // ---------------------------------------------------------------------
        // 5. Load contribution relationship
        // ---------------------------------------------------------------------

        $paymentCode->load([
            'monthlyContribution:id,club_id,period_id,user_id,amount,status',
        ]);

        // ---------------------------------------------------------------------
        // 6. Find bank account
        // ---------------------------------------------------------------------

        $bankAccount =
            $this->bankAccountRepository
            ->findActiveDefaultByClub(
                (int) $contribution->club_id
            );

        if (!$bankAccount) {
            throw new ApiException(
                __('domains/member_payment_code.bank_account_not_found'),
                422,
                'BANK_ACCOUNT_NOT_FOUND'
            );
        }

        // ---------------------------------------------------------------------
        // 7. QR
        // ---------------------------------------------------------------------

        $qrEnabled = (bool) config(
            'app.qr.enabled',
            true
        );

        $qrUrl = $qrEnabled
            ? $this->buildQrUrl(
                $paymentCode,
                $bankAccount
            )
            : null;

        // ---------------------------------------------------------------------
        // 8. Return payment data
        // ---------------------------------------------------------------------

        return new MemberPaymentCodePaymentData(
            paymentCode: $paymentCode,
            bankAccount: $bankAccount,
            qrEnabled: $qrEnabled,
            qrUrl: $qrUrl,
        );
    }


    private function buildQrUrl(
        MemberPaymentCode $paymentCode,
        BankAccount $bankAccount
    ): string {
        $bankShortName = $bankAccount->bank->short_name;

        if (!$bankShortName) {
            throw new ApiException(
                __('domains/member_payment_code.qr_bank_not_configured'),
                422,
                'QR_BANK_NOT_CONFIGURED'
            );
        }

        $amount =
            $paymentCode
            ->monthlyContribution
            ->amount;

        $query = http_build_query([
            'bank' =>
            $bankShortName,

            'acc' =>
            $bankAccount->account_number,

            'template' =>
            'qronly',

            'amount' =>
            $this->formatQrAmount($amount),

            'des' =>
            $paymentCode->payment_code,

            'showinfo' =>
            'true',

            'holder' =>
            strtoupper(
                $bankAccount->account_name
            ),
        ]);

        return rtrim(
            config('app.qr.provider_url'),
            '/'
        ) . '?' . $query;
    }

    private function formatQrAmount($amount): string
    {
        return rtrim(
            rtrim(
                number_format(
                    (float) $amount,
                    2,
                    '.',
                    ''
                ),
                '0'
            ),
            '.'
        );
    }

    // -------------------------------------------------------------------------
    // Authorization
    // -------------------------------------------------------------------------

    /**
     * Kiểm tra user hiện tại có quyền generate/reuse
     * payment code cho contribution hay không.
     */
    private function authorizeGenerateOrReuse(
        MonthlyContribution $contribution
    ): void {

        /** @var User|null $user */
        $user = Auth::user();

        if (!$user) {
            throw new ApiException(
                __('domains/member_payment_code.forbidden'),
                403
            );
        }

        // ---------------------------------------------------------------------
        // Superadmin
        // ---------------------------------------------------------------------

        if ($user->isSuperAdmin()) {
            return;
        }

        // ---------------------------------------------------------------------
        // System admin
        //
        // System scope:
        // clubId = null
        // ---------------------------------------------------------------------

        if ($user->isSystemAdmin()) {
            if (
                $user->hasPermission(
                    'member_payment_code',
                    'view',
                    null
                )
            ) {
                return;
            }

            throw new ApiException(
                __('domains/member_payment_code.forbidden'),
                403
            );
        }

        // ---------------------------------------------------------------------
        // Club scope
        // ---------------------------------------------------------------------

        $clubId = $this->resolveContributionClubId(
            $contribution
        );

        if (
            $clubId !== null
            && $user->hasPermission(
                'member_payment_code',
                'view',
                $clubId
            )
        ) {
            return;
        }

        // ---------------------------------------------------------------------
        // Owner
        //
        // Nếu user không có permission quản lý nhưng
        // là owner của contribution thì vẫn được generate.
        // ---------------------------------------------------------------------

        if (
            (int) $user->id ===
            (int) $contribution->user_id
        ) {
            return;
        }

        // ---------------------------------------------------------------------
        // Forbidden
        // ---------------------------------------------------------------------

        throw new ApiException(
            __('domains/member_payment_code.forbidden'),
            403
        );
    }

    /**
     * Lấy club_id của contribution.
     *
     * Ưu tiên club_id trực tiếp.
     * Nếu contribution không có club_id thì thử
     * lấy từ relationship period.
     */
    private function resolveContributionClubId(
        MonthlyContribution $contribution
    ): ?int {
        if (
            isset($contribution->club_id)
            && $contribution->club_id !== null
        ) {
            return (int) $contribution->club_id;
        }

        if (
            $contribution->relationLoaded('period')
            && $contribution->period
        ) {
            if (
                isset($contribution->period->club_id)
                && $contribution->period->club_id !== null
            ) {
                return (int) $contribution
                    ->period
                    ->club_id;
            }
        }

        return null;
    }

    // -------------------------------------------------------------------------
    // Business validation
    // -------------------------------------------------------------------------

    private function validateContributionStatus(
        MonthlyContribution $contribution
    ): void {
        if (
            $contribution->status === MonthlyContribution::STATUS_PAID
        ) {
            throw new ApiException(__('domains/member_payment_code.already_paid'), 422, 'PAYMENT_ALREADY_PAID');
        }

        if (
            $contribution->status === MonthlyContribution::STATUS_CANCELLED
        ) {
            throw new ApiException(__('domains/member_payment_code.already_cancelled'), 422, 'PAYMENT_ALREADY_CANCELLED');
        }
    }

    // -------------------------------------------------------------------------
    // Generate
    // -------------------------------------------------------------------------

    private function generateUniqueCode(): string
    {
        $chars = self::CODE_CHARS;
        $len = strlen($chars);

        do {
            $code = '';

            for (
                $i = 0;
                $i < self::CODE_LENGTH;
                $i++
            ) {
                $code .= $chars[random_int(0, $len - 1)];
            }
        } while (
            $this->repository->codeExists($code)
        );

        return $code;
    }
}

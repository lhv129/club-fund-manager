<?php

namespace App\Domains\MemberPaymentCode\Data;

use App\Domains\Bank\Models\BankAccount;
use App\Domains\MemberPaymentCode\Models\MemberPaymentCode;

class MemberPaymentCodePaymentData
{
    public function __construct(
        public MemberPaymentCode $paymentCode,
        public BankAccount $bankAccount,
        public bool $qrEnabled,
        public ?string $qrUrl,
    ) {}

    public function getAmount(): string
    {
        return $this->paymentCode
            ->monthlyContribution
            ->amount;
    }
}

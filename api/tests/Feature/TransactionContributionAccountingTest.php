<?php

namespace Tests\Feature;

use App\Domains\Club\Models\Club;
use App\Domains\ClubFund\Models\ClubFund;
use App\Domains\ClubFund\Services\ClubFundService;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\MonthlyContribution\Services\MonthlyContributionService;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\User\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionContributionAccountingTest extends TestCase
{
    use RefreshDatabase;

    public function test_cash_payment_creates_one_transaction_and_updates_fund_once(): void
    {
        [$club, $period] = $this->createClubAndPeriod();
        $contribution = $this->createContribution($club, $period, 'cash@example.com');
        $service = app(MonthlyContributionService::class);

        $paid = $service->update($contribution->id, [
            'club_id' => $club->id,
            'user_id' => $contribution->user_id,
            'period_id' => $period->id,
            'status' => MonthlyContribution::STATUS_PAID,
            'paid_by' => MonthlyContribution::PAID_BY_CASH,
            'payment_date' => '2026-08-14 20:52:15',
        ]);

        $this->assertNotNull($paid->transaction_id);
        $this->assertSame('100000.00', $this->fundBalance($club));
        $this->assertDatabaseHas('transactions', [
            'id' => $paid->transaction_id,
            'club_id' => $club->id,
            'source' => Transaction::SOURCE_CASH,
            'type' => Transaction::TYPE_INCOME,
            'amount' => 100000,
            'description' => 'Thu tiền mặt khoản đóng quỹ tháng 8/2026 - cash@example.com',
        ]);

        $service->update($contribution->id, [
            'club_id' => $club->id,
            'user_id' => $contribution->user_id,
            'period_id' => $period->id,
            'status' => MonthlyContribution::STATUS_PAID,
            'paid_by' => MonthlyContribution::PAID_BY_CASH,
            'payment_date' => '2026-08-14 21:00:00',
        ]);

        $this->assertSame(1, Transaction::query()->count());
        $this->assertSame('100000.00', $this->fundBalance($club));
    }

    public function test_deleting_cash_reverses_fund_but_deleting_bank_cancels_contribution_only(): void
    {
        [$club, $period] = $this->createClubAndPeriod();
        $cashContribution = $this->createContribution($club, $period, 'cash@example.com');
        $bankContribution = $this->createContribution($club, $period, 'bank@example.com');
        $service = app(MonthlyContributionService::class);

        $cashContribution = $service->update($cashContribution->id, [
            'club_id' => $club->id,
            'user_id' => $cashContribution->user_id,
            'period_id' => $period->id,
            'status' => MonthlyContribution::STATUS_PAID,
            'paid_by' => MonthlyContribution::PAID_BY_CASH,
        ]);

        $bankTransaction = app(ClubFundService::class)->recordTransaction([
            'club_id' => $club->id,
            'source' => Transaction::SOURCE_WEBHOOK,
            'type' => Transaction::TYPE_INCOME,
            'amount' => 100000,
            'transaction_date' => now(),
            'sort_order' => 0,
            'is_active' => true,
        ]);
        $bankContribution->update([
            'transaction_id' => $bankTransaction->id,
            'status' => MonthlyContribution::STATUS_PAID,
            'paid_by' => MonthlyContribution::PAID_BY_BANK,
            'payment_date' => now(),
        ]);

        $this->assertSame('200000.00', $this->fundBalance($club));

        $service->deleteForClub($cashContribution->id, $club->id);
        $this->assertSame('100000.00', $this->fundBalance($club));
        $this->assertSoftDeleted('transactions', ['id' => $cashContribution->transaction_id]);

        $service->deleteForClub($bankContribution->id, $club->id);
        $this->assertSame('100000.00', $this->fundBalance($club));
        $this->assertDatabaseHas('monthly_contributions', [
            'id' => $bankContribution->id,
            'transaction_id' => $bankTransaction->id,
            'status' => MonthlyContribution::STATUS_CANCELLED,
            'is_active' => false,
            'deleted_at' => null,
        ]);
        $this->assertDatabaseHas('transactions', [
            'id' => $bankTransaction->id,
            'source' => Transaction::SOURCE_WEBHOOK,
            'is_active' => true,
            'deleted_at' => null,
        ]);
    }

    public function test_creating_a_soft_deleted_contribution_restores_it_as_pending(): void
    {
        [$club, $period] = $this->createClubAndPeriod();
        $contribution = $this->createContribution($club, $period, 'restore@example.com');
        $service = app(MonthlyContributionService::class);

        $contribution = $service->update($contribution->id, [
            'club_id' => $club->id,
            'user_id' => $contribution->user_id,
            'period_id' => $period->id,
            'status' => MonthlyContribution::STATUS_PAID,
            'paid_by' => MonthlyContribution::PAID_BY_CASH,
        ]);

        $originalId = $contribution->id;
        $service->deleteForClub($originalId, $club->id);

        $restored = $service->create([
            'club_id' => $club->id,
            'user_id' => $contribution->user_id,
            'period_id' => $period->id,
            'status' => MonthlyContribution::STATUS_PAID,
            'paid_by' => MonthlyContribution::PAID_BY_CASH,
        ]);

        $this->assertSame($originalId, $restored->id);
        $this->assertSame(MonthlyContribution::STATUS_PENDING, $restored->status);
        $this->assertNull($restored->transaction_id);
        $this->assertNull($restored->paid_by);
        $this->assertNull($restored->payment_date);
        $this->assertTrue($restored->is_active);
        $this->assertSame(1, MonthlyContribution::withTrashed()
            ->where('club_id', $club->id)
            ->where('user_id', $contribution->user_id)
            ->where('period_id', $period->id)
            ->count());
        $this->assertSame('0.00', $this->fundBalance($club));
    }

    private function createClubAndPeriod(): array
    {
        $club = Club::create(['is_active' => true]);
        $period = FundPeriod::create([
            'club_id' => $club->id,
            'year' => 2026,
            'month' => 8,
            'male_amount' => 100000,
            'female_amount' => 100000,
            'is_locked' => false,
            'is_active' => true,
        ]);

        return [$club, $period];
    }

    private function createContribution(Club $club, FundPeriod $period, string $email): MonthlyContribution
    {
        $user = User::create([
            'fullname' => $email,
            'email' => $email,
            'password' => 'password',
            'gender' => 'male',
            'status' => User::STATUS_ACTIVE,
        ]);

        return MonthlyContribution::create([
            'club_id' => $club->id,
            'user_id' => $user->id,
            'period_id' => $period->id,
            'amount' => 100000,
            'status' => MonthlyContribution::STATUS_PENDING,
            'is_active' => true,
        ]);
    }

    private function fundBalance(Club $club): string
    {
        return (string) ClubFund::query()
            ->where('club_id', $club->id)
            ->value('balance');
    }
}

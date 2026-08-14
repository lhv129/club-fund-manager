<?php

namespace Tests\Feature;

use App\Domains\Club\Models\Club;
use App\Domains\ClubFund\Models\ClubFund;
use App\Domains\ClubFund\Services\ClubFundService;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\MonthlyContribution\Services\MonthlyContributionService;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\Transaction\Services\TransactionService;
use App\Domains\User\Models\User;
use App\Exceptions\ApiException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TransactionContributionAccountingTest extends TestCase
{
    use RefreshDatabase;

    public function test_linking_existing_cash_or_bank_transaction_does_not_change_fund_balance(): void
    {
        [$club, $period] = $this->createClubAndPeriod();
        $cashContribution = $this->createContribution($club, $period, 'cash@example.com');
        $bankContribution = $this->createContribution($club, $period, 'bank@example.com');

        $cash = app(TransactionService::class)->create([
            'club_id' => $club->id,
            'source' => Transaction::SOURCE_CASH,
            'amount' => 100000,
        ]);
        $bank = app(ClubFundService::class)->recordTransaction([
            'club_id' => $club->id,
            'source' => Transaction::SOURCE_WEBHOOK,
            'type' => Transaction::TYPE_INCOME,
            'amount' => 200000,
            'transaction_date' => now(),
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $this->assertSame('300000.00', $this->fundBalance($club));

        $service = app(MonthlyContributionService::class);
        $service->update($cashContribution->id, [
            'club_id' => $club->id,
            'status' => MonthlyContribution::STATUS_PAID,
            'paid_by' => MonthlyContribution::PAID_BY_CASH,
            'transaction_id' => $cash->id,
        ]);
        $service->update($bankContribution->id, [
            'club_id' => $club->id,
            'status' => MonthlyContribution::STATUS_PAID,
            'paid_by' => MonthlyContribution::PAID_BY_BANK,
            'transaction_id' => $bank->id,
        ]);

        $this->assertSame('300000.00', $this->fundBalance($club));
    }

    public function test_contribution_only_accepts_a_transaction_matching_the_payment_method(): void
    {
        [$club, $period] = $this->createClubAndPeriod();
        $contribution = $this->createContribution($club, $period, 'member@example.com');
        $cash = app(TransactionService::class)->create([
            'club_id' => $club->id,
            'source' => Transaction::SOURCE_CASH,
            'amount' => 100000,
        ]);

        try {
            app(MonthlyContributionService::class)->update($contribution->id, [
                'club_id' => $club->id,
                'status' => MonthlyContribution::STATUS_PAID,
                'paid_by' => MonthlyContribution::PAID_BY_BANK,
                'transaction_id' => $cash->id,
            ]);

            $this->fail('A cash transaction must not be accepted as a bank payment.');
        } catch (ApiException $exception) {
            $this->assertSame('INVALID_PAYMENT_TRANSACTION', $exception->getErrorCode());
        }

        $this->assertSame(MonthlyContribution::STATUS_PENDING, $contribution->fresh()->status);
        $this->assertSame('100000.00', $this->fundBalance($club));
    }

    public function test_cash_crud_adjusts_balance_and_webhook_financial_data_is_immutable(): void
    {
        [$club] = $this->createClubAndPeriod();
        $transactionService = app(TransactionService::class);

        $cash = $transactionService->create([
            'club_id' => $club->id,
            'source' => Transaction::SOURCE_CASH,
            'amount' => 100000,
        ]);

        $transactionService->updateForClub($cash->id, $club->id, [
            'amount' => 150000,
            'description' => 'Cash contribution',
        ]);

        $this->assertSame('150000.00', $this->fundBalance($club));

        $transactionService->deleteForClub($cash->id, $club->id);

        $this->assertSame('0.00', $this->fundBalance($club));
        $this->assertSoftDeleted('transactions', ['id' => $cash->id]);

        $webhook = app(ClubFundService::class)->recordTransaction([
            'club_id' => $club->id,
            'source' => Transaction::SOURCE_WEBHOOK,
            'type' => Transaction::TYPE_INCOME,
            'amount' => 200000,
            'description' => 'Original',
            'transaction_date' => now(),
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $updated = $transactionService->updateForClub($webhook->id, $club->id, [
            'description' => 'Updated description',
        ]);

        $this->assertSame('Updated description', $updated->description);
        $this->assertSame('200000.00', $this->fundBalance($club));

        try {
            $transactionService->updateForClub($webhook->id, $club->id, [
                'amount' => 250000,
            ]);

            $this->fail('Webhook financial data must be immutable.');
        } catch (ApiException $exception) {
            $this->assertSame('WEBHOOK_TRANSACTION_IMMUTABLE', $exception->getErrorCode());
        }

        try {
            $transactionService->deleteForClub($webhook->id, $club->id);

            $this->fail('Webhook transactions must not be deleted.');
        } catch (ApiException $exception) {
            $this->assertSame('WEBHOOK_TRANSACTION_DELETE_FORBIDDEN', $exception->getErrorCode());
        }

        $this->assertSame('200000.00', $this->fundBalance($club));
        $this->assertDatabaseHas('transactions', [
            'id' => $webhook->id,
            'deleted_at' => null,
        ]);
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
        return (string) ClubFund::where('club_id', $club->id)->value('balance');
    }
}

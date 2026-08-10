<?php

namespace Tests\Feature;

use App\Domains\Club\Models\Club;
use App\Domains\ClubFund\Models\ClubFund;
use App\Domains\ClubFund\Services\ClubFundService;
use App\Domains\ExchangeSession\Models\ExchangeSession;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\PlayingSchedule\Services\PlayingScheduleService;
use App\Domains\Transaction\Services\TransactionService;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ClubFundWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_auto_schedule_generates_sessions_from_fund_period_start_immediately(): void
    {
        Carbon::setTestNow('2026-08-18 10:00:00');
        $club = Club::create(['is_active' => true]);
        FundPeriod::create([
            'club_id' => $club->id,
            'year' => 2026,
            'month' => 8,
            'is_active' => true,
        ]);

        $schedule = app(PlayingScheduleService::class)->create([
            'club_id' => $club->id,
            'weekday' => Carbon::TUESDAY,
            'start_time' => '19:00',
            'end_time' => '21:00',
            'auto_generate' => true,
            'weeks_ahead' => 4,
            'is_active' => true,
            'translations' => [],
        ]);

        $this->assertSame(
            ['2026-08-04', '2026-08-11', '2026-08-18', '2026-08-25'],
            ExchangeSession::where('playing_schedule_id', $schedule->id)
                ->orderBy('session_date')
                ->pluck('session_date')
                ->map(fn ($date) => Carbon::parse($date)->toDateString())
                ->all()
        );
    }

    public function test_manual_transactions_update_persisted_club_balance(): void
    {
        $club = Club::create(['is_active' => true]);
        $service = app(TransactionService::class);

        $income = $service->create([
            'club_id' => $club->id,
            'type' => 'expense', // API manual luôn ép income
            'source' => 'cash',
            'amount' => 500000,
        ]);
        $expense = app(ClubFundService::class)->recordTransaction([
            'club_id' => $club->id,
            'source' => 'webhook',
            'type' => 'expense',
            'amount' => 125000,
            'transaction_date' => now(),
            'sort_order' => 0,
            'is_active' => true,
        ]);

        $this->assertSame('500000.00', $income->balance);
        $this->assertSame('375000.00', $expense->balance);
        $this->assertSame('375000.00', ClubFund::where('club_id', $club->id)->value('balance'));
    }
}

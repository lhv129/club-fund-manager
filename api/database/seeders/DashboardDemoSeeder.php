<?php

namespace Database\Seeders;

use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DashboardDemoSeeder extends Seeder
{
    private const CLUB_SLUG = 'clb-bet-min';

    private const YEAR = 2026;

    public function run(): void
    {
        $clubId = DB::table('club_translations')
            ->where('locale', 'vi')
            ->where('slug', self::CLUB_SLUG)
            ->value('club_id');

        if (!$clubId) {
            $this->command?->error('Khong tim thay club slug "'.self::CLUB_SLUG.'". Hay chay ClubAndManagerSeeder truoc.');

            return;
        }

        DB::transaction(function () use ($clubId): void {
            $users = $this->seedMembers((int) $clubId);
            $periods = $this->seedFundPeriods((int) $clubId);
            $this->seedContributions((int) $clubId, $users, $periods);

            $schedules = $this->seedPlayingSchedules((int) $clubId);
            $this->seedExchangeSessions((int) $clubId, $users, $schedules);
            $this->seedExpenses((int) $clubId, $users[0]);
            $this->recalculateBalances((int) $clubId);
        });

        $this->command?->info('Da tao du lieu dashboard thang 05, 06, 07/2026 cho club clb-demo.');
    }

    private function seedMembers(int $clubId): array
    {
        $members = [
            ['Nguyen Minh Anh', 'male'],
            ['Tran Thu Ha', 'female'],
            ['Le Quang Huy', 'male'],
            ['Pham Ngoc Lan', 'female'],
            ['Do Tuan Kiet', 'male'],
            ['Hoang Mai Chi', 'female'],
            ['Bui Duc Long', 'male'],
            ['Vu Thanh Thao', 'female'],
            ['Dang Gia Bao', 'male'],
            ['Ngo Khanh Linh', 'female'],
        ];

        $userIds = [];
        foreach ($members as $index => [$fullname, $gender]) {
            $number = $index + 1;
            $email = "dashboard.demo{$number}@example.com";
            $now = now();

            DB::table('users')->updateOrInsert(
                ['email' => $email],
                [
                    'fullname' => $fullname,
                    'username' => "dashboard_demo_{$number}",
                    'phone' => '090900'.str_pad((string) $number, 4, '0', STR_PAD_LEFT),
                    'gender' => $gender,
                    'password' => Hash::make('12345678'),
                    'status' => 'active',
                    'email_verified_at' => $now,
                    'deleted_at' => null,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );

            $userId = (int) DB::table('users')->where('email', $email)->value('id');
            $userIds[] = $userId;

            DB::table('club_members')->updateOrInsert(
                ['club_id' => $clubId, 'user_id' => $userId],
                [
                    'join_type' => 'request',
                    'status' => 'approved',
                    'reviewed_at' => Carbon::create(self::YEAR, 4, 25)->addDays($index),
                    'joined_at' => Carbon::create(self::YEAR, 4, 25)->addDays($index),
                    'sort_order' => $number,
                    'is_active' => true,
                    'deleted_at' => null,
                    'updated_at' => $now,
                    'created_at' => $now,
                ]
            );
        }

        return $userIds;
    }

    private function seedFundPeriods(int $clubId): array
    {
        $periodIds = [];
        foreach ([5, 6, 7] as $month) {
            DB::table('fund_periods')->updateOrInsert(
                ['club_id' => $clubId, 'year' => self::YEAR, 'month' => $month],
                [
                    'male_amount' => 300000,
                    'female_amount' => 250000,
                    'exchange_male_amount' => 80000,
                    'exchange_female_amount' => 70000,
                    'is_locked' => $month < 7,
                    'sort_order' => $month,
                    'is_active' => true,
                    'deleted_at' => null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $periodIds[$month] = (int) DB::table('fund_periods')
                ->where(['club_id' => $clubId, 'year' => self::YEAR, 'month' => $month])
                ->value('id');
        }

        return $periodIds;
    }

    private function seedContributions(int $clubId, array $users, array $periods): void
    {
        $statuses = [
            5 => ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'pending'],
            6 => ['paid', 'paid', 'paid', 'paid', 'paid', 'paid', 'pending', 'pending', 'pending', 'cancelled'],
            7 => ['paid', 'paid', 'paid', 'paid', 'pending', 'pending', 'pending', 'pending', 'cancelled', 'cancelled'],
        ];

        foreach ($periods as $month => $periodId) {
            foreach ($users as $index => $userId) {
                $status = $statuses[$month][$index];
                $amount = $index % 2 === 0 ? 300000 : 250000;
                $transactionId = null;
                $paymentDate = null;
                $paidBy = null;

                if ($status === 'paid') {
                    $paymentDate = Carbon::create(self::YEAR, $month, 3)->addDays($index);
                    $paidBy = $index % 3 === 0 ? 'cash' : 'bank';
                    $transactionId = $this->upsertTransaction($clubId, [
                        'user_id' => $userId,
                        'source' => $paidBy === 'cash' ? 'cash' : 'manual',
                        'type' => 'income',
                        'amount' => $amount,
                        'reference_code' => sprintf('dashboard-demo-contribution-%d-%02d', $userId, $month),
                        'sender_name' => DB::table('users')->where('id', $userId)->value('fullname'),
                        'description' => sprintf('Dong quy thang %02d/%d', $month, self::YEAR),
                        'transaction_date' => $paymentDate,
                    ]);
                }

                DB::table('monthly_contributions')->updateOrInsert(
                    ['club_id' => $clubId, 'user_id' => $userId, 'period_id' => $periodId],
                    [
                        'transaction_id' => $transactionId,
                        'amount' => $amount,
                        'status' => $status,
                        'paid_by' => $paidBy,
                        'payment_date' => $paymentDate,
                        'sort_order' => $index + 1,
                        'is_active' => true,
                        'deleted_at' => null,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }

    private function seedPlayingSchedules(int $clubId): array
    {
        $definitions = [
            ['weekday' => 3, 'court_name' => 'San Cau Giay', 'start_time' => '19:00:00', 'end_time' => '21:00:00', 'vi' => 'Buoi thu Tu', 'en' => 'Wednesday Session'],
            ['weekday' => 6, 'court_name' => 'San My Dinh', 'start_time' => '18:00:00', 'end_time' => '20:00:00', 'vi' => 'Buoi thu Bay', 'en' => 'Saturday Session'],
        ];

        $scheduleIds = [];
        foreach ($definitions as $index => $definition) {
            DB::table('playing_schedules')->updateOrInsert(
                ['club_id' => $clubId, 'weekday' => $definition['weekday'], 'court_name' => $definition['court_name']],
                [
                    'court_address' => 'Ha Noi',
                    'start_time' => $definition['start_time'],
                    'end_time' => $definition['end_time'],
                    'auto_generate' => false,
                    'weeks_ahead' => 8,
                    'start_date' => self::YEAR.'-05-01',
                    'end_date' => self::YEAR.'-07-31',
                    'sort_order' => $index + 1,
                    'is_active' => true,
                    'deleted_at' => null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $scheduleId = (int) DB::table('playing_schedules')
                ->where(['club_id' => $clubId, 'weekday' => $definition['weekday'], 'court_name' => $definition['court_name']])
                ->value('id');
            $scheduleIds[] = $scheduleId;

            foreach (['vi', 'en'] as $locale) {
                DB::table('playing_schedule_translations')->updateOrInsert(
                    ['playing_schedule_id' => $scheduleId, 'locale' => $locale],
                    [
                        'title' => $definition[$locale],
                        'note' => null,
                        'sort_order' => 0,
                        'is_active' => true,
                        'deleted_at' => null,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }

        return $scheduleIds;
    }

    private function seedExchangeSessions(int $clubId, array $users, array $schedules): void
    {
        $sessions = [
            [5, 7, 0, 'completed'], [5, 14, 1, 'completed'], [5, 24, null, 'completed'],
            [6, 4, 0, 'completed'], [6, 13, 1, 'completed'], [6, 25, 0, 'completed'],
            [7, 2, 0, 'completed'], [7, 11, 1, 'completed'], [7, 20, null, 'completed'], [7, 30, 0, 'upcoming'],
        ];

        foreach ($sessions as $sessionIndex => [$month, $day, $scheduleIndex, $status]) {
            $date = Carbon::create(self::YEAR, $month, $day);
            $manual = $scheduleIndex === null;
            $courtName = $manual ? 'San Ngoai Gio' : ($scheduleIndex === 0 ? 'San Cau Giay' : 'San My Dinh');
            $startTime = $manual ? '20:00:00' : ($scheduleIndex === 0 ? '19:00:00' : '18:00:00');

            DB::table('exchange_sessions')->updateOrInsert(
                ['club_id' => $clubId, 'session_date' => $date->toDateString(), 'court_name' => $courtName],
                [
                    'playing_schedule_id' => $manual ? null : $schedules[$scheduleIndex],
                    'transaction_id' => null,
                    'court_address' => 'Ha Noi',
                    'start_time' => $startTime,
                    'end_time' => $manual ? '22:00:00' : ($scheduleIndex === 0 ? '21:00:00' : '20:00:00'),
                    'type' => $manual ? 'manual' : 'scheduled',
                    'status' => $status,
                    'player_count' => 12 + ($sessionIndex % 4) * 2,
                    'amount_per_player' => 75000,
                    'total_amount' => 900000 + ($sessionIndex % 4) * 150000,
                    'exchange_male_amount' => 80000,
                    'exchange_female_amount' => 70000,
                    'sort_order' => $sessionIndex + 1,
                    'is_active' => true,
                    'deleted_at' => null,
                    'updated_at' => now(),
                    'created_at' => now(),
                ]
            );

            $sessionId = (int) DB::table('exchange_sessions')
                ->where(['club_id' => $clubId, 'session_date' => $date->toDateString(), 'court_name' => $courtName])
                ->value('id');

            foreach ([0, 1, 2] as $groupIndex) {
                $userId = $users[($sessionIndex + $groupIndex) % count($users)];
                $male = 2 + (($sessionIndex + $groupIndex) % 3);
                $female = 1 + (($sessionIndex + $groupIndex) % 2);
                $amount = $male * 80000 + $female * 70000;
                $paid = ($sessionIndex + $groupIndex) % 4 !== 0;
                $transactionId = null;

                if ($paid) {
                    $transactionId = $this->upsertTransaction($clubId, [
                        'user_id' => $userId,
                        'source' => $groupIndex === 0 ? 'cash' : 'manual',
                        'type' => 'income',
                        'amount' => $amount,
                        'reference_code' => "dashboard-demo-session-{$sessionId}-{$groupIndex}",
                        'sender_name' => DB::table('users')->where('id', $userId)->value('fullname'),
                        'description' => 'Thu tien giao luu '.$date->format('d/m/Y'),
                        'transaction_date' => $date->copy()->setTime(21, $groupIndex * 10),
                    ]);
                }

                DB::table('exchange_session_players')->updateOrInsert(
                    ['exchange_session_id' => $sessionId, 'user_id' => $userId],
                    [
                        'group_name' => 'Nhom '.($groupIndex + 1),
                        'male' => $male,
                        'female' => $female,
                        'transaction_id' => $transactionId,
                        'amount' => $amount,
                        'paid' => $paid,
                        'sort_order' => $groupIndex + 1,
                        'is_active' => true,
                        'deleted_at' => null,
                        'updated_at' => now(),
                        'created_at' => now(),
                    ]
                );
            }
        }
    }

    private function seedExpenses(int $clubId, int $userId): void
    {
        $expenses = [
            [5, 9, 1200000, 'Tien thue san thang 5'], [5, 22, 350000, 'Mua cau thi dau'],
            [6, 8, 1350000, 'Tien thue san thang 6'], [6, 19, 480000, 'Mua nuoc va dung cu'],
            [7, 6, 1450000, 'Tien thue san thang 7'], [7, 18, 620000, 'Bao tri luoi va cot'],
        ];

        foreach ($expenses as $index => [$month, $day, $amount, $description]) {
            $this->upsertTransaction($clubId, [
                'user_id' => $userId,
                'source' => 'manual',
                'type' => 'expense',
                'amount' => $amount,
                'reference_code' => sprintf('dashboard-demo-expense-%02d-%02d', $month, $index + 1),
                'sender_name' => null,
                'description' => $description,
                'transaction_date' => Carbon::create(self::YEAR, $month, $day, 10),
            ]);
        }
    }

    private function upsertTransaction(int $clubId, array $data): int
    {
        DB::table('transactions')->updateOrInsert(
            ['club_id' => $clubId, 'reference_code' => $data['reference_code']],
            array_merge($data, [
                'bank_account_id' => null,
                'webhook_config_id' => null,
                'balance' => null,
                'sender_account' => null,
                'raw_payload' => null,
                'sort_order' => 0,
                'is_active' => true,
                'deleted_at' => null,
                'updated_at' => now(),
                'created_at' => now(),
            ])
        );

        return (int) DB::table('transactions')
            ->where('club_id', $clubId)
            ->where('reference_code', $data['reference_code'])
            ->value('id');
    }

    private function recalculateBalances(int $clubId): void
    {
        $balance = 0.0;
        $transactions = DB::table('transactions')
            ->where('club_id', $clubId)
            ->whereNull('deleted_at')
            ->orderBy('transaction_date')
            ->orderBy('id')
            ->get(['id', 'type', 'amount']);

        foreach ($transactions as $transaction) {
            $balance += $transaction->type === 'income'
                ? (float) $transaction->amount
                : -(float) $transaction->amount;

            DB::table('transactions')->where('id', $transaction->id)->update(['balance' => $balance]);
        }

        DB::table('club_funds')->updateOrInsert(
            ['club_id' => $clubId],
            ['balance' => $balance, 'updated_at' => now(), 'created_at' => now()]
        );
    }
}

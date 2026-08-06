<?php

namespace App\Domains\ExchangeSession\Services;

use App\Domains\ExchangeSession\Repositories\ExchangeSessionRepository;
use App\Domains\PlayingSchedule\Models\PlayingSchedule;
use App\Domains\PlayingSchedule\Repositories\PlayingScheduleRepository;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExchangeSessionGeneratorService
{
    public function __construct(
        protected PlayingScheduleRepository $scheduleRepository,
        protected ExchangeSessionRepository $sessionRepository,
    ) {}

    // ── Public API ───────────────────────────────────────────────────────────

    /**
     * Generate sessions cho tất cả schedule active + auto_generate.
     *
     * @return array{total_schedules: int, total_created: int, total_skipped: int}
     */
    public function generateAll(): array
    {
        $schedules = $this->scheduleRepository->getAutoGenerateable();

        $totalCreated = 0;
        $totalSkipped = 0;

        foreach ($schedules as $schedule) {
            ['created' => $c, 'skipped' => $s] = $this->generateForSchedule($schedule);
            $totalCreated += $c;
            $totalSkipped += $s;
        }

        Log::info('[ExchangeSessionGenerator] generateAll complete', [
            'total_schedules' => $schedules->count(),
            'total_created'   => $totalCreated,
            'total_skipped'   => $totalSkipped,
        ]);

        return [
            'total_schedules' => $schedules->count(),
            'total_created'   => $totalCreated,
            'total_skipped'   => $totalSkipped,
        ];
    }

    /**
     * Generate sessions cho 1 schedule cụ thể.
     *
     * @return array{created: int, skipped: int}
     */
    public function generateForSchedule(PlayingSchedule $schedule): array
    {
        // Guard: schedule phải active + auto_generate
        if (!$schedule->is_active || !$schedule->auto_generate) {
            Log::info('[ExchangeSessionGenerator] Schedule skipped (inactive or auto_generate=false)', [
                'schedule_id' => $schedule->id,
            ]);
            return ['created' => 0, 'skipped' => 0];
        }

        $dates   = $this->getTargetDates($schedule);
        $created = 0;
        $skipped = 0;

        foreach ($dates as $date) {
            $this->createSessionIfNotExists($schedule, $date)
                ? $created++
                : $skipped++;
        }

        Log::info('[ExchangeSessionGenerator] Schedule processed', [
            'schedule_id' => $schedule->id,
            'club_id'     => $schedule->club_id,
            'weekday'     => $schedule->weekday,
            'dates_count' => count($dates),
            'created'     => $created,
            'skipped'     => $skipped,
        ]);

        return ['created' => $created, 'skipped' => $skipped];
    }

    /**
     * Đồng bộ court_name / court_address / start_time / end_time cho mọi
     * ExchangeSession upcoming + scheduled của 1 PlayingSchedule.
     *
     * Dùng khi admin sửa PlayingSchedule (giờ/sân). Bỏ qua session đã
     * completed/cancelled (đã chốt số liệu / đã huỷ) — tránh đè.
     *
     * @return int  số session đã được cập nhật
     */
    public function syncUpcomingForSchedule(PlayingSchedule $schedule): int
    {
        $sessions = $this->sessionRepository->getUpcomingScheduledForSchedule($schedule->id);

        if ($sessions->isEmpty()) {
            Log::info('[ExchangeSessionGenerator] syncUpcoming — no upcoming sessions', [
                'schedule_id' => $schedule->id,
            ]);
            return 0;
        }

        $updated = 0;

        foreach ($sessions as $session) {
            // Ghép session_date hiện có của session + giờ mới từ schedule
            $startTime = Carbon::parse($session->session_date)->setTimeFromTimeString(
                Carbon::parse($schedule->start_time)->format('H:i:s')
            );
            $endTime = Carbon::parse($session->session_date)->setTimeFromTimeString(
                Carbon::parse($schedule->end_time)->format('H:i:s')
            );

            $this->sessionRepository->update($session, [
                'court_name'    => $schedule->court_name,
                'court_address' => $schedule->court_address,
                'start_time'    => $startTime,
                'end_time'      => $endTime,
            ]);
            $updated++;
        }

        Log::info('[ExchangeSessionGenerator] syncUpcoming complete', [
            'schedule_id' => $schedule->id,
            'updated'     => $updated,
        ]);

        return $updated;
    }

    /**
     * Sync tất cả schedule active + auto_generate — cho command chạy tay.
     *
     * @return array{total_schedules: int, total_updated: int}
     */
    public function syncAll(): array
    {
        $schedules = $this->scheduleRepository->getAutoGenerateable();

        $totalUpdated = 0;

        foreach ($schedules as $schedule) {
            $totalUpdated += $this->syncUpcomingForSchedule($schedule);
        }

        Log::info('[ExchangeSessionGenerator] syncAll complete', [
            'total_schedules' => $schedules->count(),
            'total_updated'   => $totalUpdated,
        ]);

        return [
            'total_schedules' => $schedules->count(),
            'total_updated'   => $totalUpdated,
        ];
    }

    // ── Private helpers ──────────────────────────────────────────────────────

    /**
     * Tính danh sách ngày cần generate.
     *
     * Quy tắc:
     *   - Từ today đến today + weeks_ahead tuần
     *   - Cắt theo start_date (nếu có) và end_date (nếu có)
     *   - Chỉ lấy ngày khớp weekday
     *   - Nếu khoảng không hợp lệ → trả []
     */
    private function getTargetDates(PlayingSchedule $schedule): array
    {
        $today    = Carbon::today();
        $rangeEnd = $today->copy()->addWeeks($schedule->weeks_ahead);
        // Thay Carbon::max() bằng ternary — tránh lỗi non-static
        $from = $schedule->start_date
            ? ($today->gte(Carbon::parse($schedule->start_date))
                ? $today->copy()
                : Carbon::parse($schedule->start_date))
            : $today->copy();
        $to = $schedule->end_date
            ? ($rangeEnd->lte(Carbon::parse($schedule->end_date))
                ? $rangeEnd->copy()
                : Carbon::parse($schedule->end_date))
            : $rangeEnd->copy();
        if ($to->lt($from)) {
            return [];
        }
        $dates  = [];
        $cursor = $from->copy()->startOfDay();
        while ($cursor->lte($to)) {
            if ($cursor->dayOfWeek === $schedule->weekday) {
                $dates[] = $cursor->toDateString();
            }
            $cursor->addDay();
        }
        return $dates;
    }


    /**
     * Tạo ExchangeSession nếu chưa tồn tại.
     * DB::transaction tránh duplicate khi 2 cron instance chạy song song.
     *
     * @return bool  true = đã tạo, false = đã tồn tại (skip)
     */
    private function createSessionIfNotExists(PlayingSchedule $schedule, string $date): bool
    {
        return DB::transaction(function () use ($schedule, $date) {
            if ($this->sessionRepository->existsForScheduleAndDate($schedule->id, $date)) {
                return false;
            }
            // Ghép session_date + giờ từ schedule → đúng datetime cho từng buổi
            $startTime = Carbon::parse($date)->setTimeFromTimeString(
                Carbon::parse($schedule->start_time)->format('H:i:s')
            );
            $endTime = Carbon::parse($date)->setTimeFromTimeString(
                Carbon::parse($schedule->end_time)->format('H:i:s')
            );
            $this->sessionRepository->create([
                'club_id'             => $schedule->club_id,
                'playing_schedule_id' => $schedule->id,
                'transaction_id'      => null,
                'session_date'  => $date,
                'court_name'    => $schedule->court_name,
                'court_address' => $schedule->court_address,
                'start_time'    => $startTime,   // 2026-08-12 19:00:00
                'end_time'      => $endTime,     // 2026-08-12 21:00:00
                'type'   => 'scheduled',
                'status' => 'upcoming',
                'player_count'      => 0,
                'amount_per_player' => 0,
                'total_amount'      => 0,
                'sort_order' => 0,
                'is_active'  => true,
            ]);
            return true;
        });
    }
}

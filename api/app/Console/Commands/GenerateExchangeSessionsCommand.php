<?php

//app/Console/Commands/GenerateExchangeSessionsCommand

namespace App\Console\Commands;

use App\Domains\ExchangeSession\Services\ExchangeSessionGeneratorService;
use App\Domains\PlayingSchedule\Repositories\PlayingScheduleRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GenerateExchangeSessionsCommand extends Command
{
    protected $signature = 'exchange-sessions:generate
                            {--schedule-id= : Chỉ generate cho 1 PlayingSchedule cụ thể (dùng khi test tay)}';

    protected $description = 'Sinh ExchangeSession từ các PlayingSchedule active + auto_generate';

    public function __construct(
        protected ExchangeSessionGeneratorService $generator,
        protected PlayingScheduleRepository       $scheduleRepository,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->info('[ExchangeSession] Bắt đầu generate...');

        try {
            if ($scheduleId = $this->option('schedule-id')) {
                return $this->handleSingle((int) $scheduleId);
            }

            return $this->handleAll();
        } catch (\Throwable $e) {
            $this->error('[ExchangeSession] Lỗi: ' . $e->getMessage());

            Log::error('[Cron] exchange-sessions:generate failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            return Command::FAILURE;
        }
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private function handleAll(): int
    {
        $result = $this->generator->generateAll();

        $this->table(
            ['Schedules xử lý', 'Session tạo mới', 'Session bỏ qua (đã tồn tại)'],
            [[
                $result['total_schedules'],
                $result['total_created'],
                $result['total_skipped'],
            ]]
        );

        $this->info('[ExchangeSession] Hoàn thành.');

        return Command::SUCCESS;
    }

    private function handleSingle(int $scheduleId): int
    {
        $schedule = $this->scheduleRepository->find($scheduleId);

        if (!$schedule) {
            $this->error("Không tìm thấy PlayingSchedule #{$scheduleId}.");
            return Command::FAILURE;
        }

        ['created' => $created, 'skipped' => $skipped] =
            $this->generator->generateForSchedule($schedule);

        $this->table(
            ['Schedule ID', 'Weekday', 'Tạo mới', 'Bỏ qua'],
            [[$schedule->id, $schedule->weekday, $created, $skipped]]
        );

        $this->info('[ExchangeSession] Hoàn thành.');

        return Command::SUCCESS;
    }
}

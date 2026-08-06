<?php

//app/Console/Commands/SyncExchangeSessionsCommand

namespace App\Console\Commands;

use App\Domains\ExchangeSession\Services\ExchangeSessionGeneratorService;
use App\Domains\PlayingSchedule\Repositories\PlayingScheduleRepository;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class SyncExchangeSessionsCommand extends Command
{
    protected $signature = 'exchange-sessions:sync
                            {--schedule-id= : Chỉ sync cho 1 PlayingSchedule cụ thể (dùng khi test tay)}';

    protected $description = 'Đồng bộ court/giờ từ PlayingSchedule sang các ExchangeSession upcoming + scheduled';

    public function __construct(
        protected ExchangeSessionGeneratorService $generator,
        protected PlayingScheduleRepository $scheduleRepository,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->rotateCronLogIfNeeded();

        $this->info('[ExchangeSession] Bắt đầu sync...');
        $this->cronLog('[ExchangeSession] Bắt đầu sync...');

        try {
            if ($scheduleId = $this->option('schedule-id')) {
                return $this->handleSingle((int) $scheduleId);
            }

            return $this->handleAll();
        } catch (\Throwable $e) {
            $this->error('[ExchangeSession] Lỗi: ' . $e->getMessage());

            Log::error('[Cron] exchange-sessions:sync failed', [
                'message' => $e->getMessage(),
                'trace'   => $e->getTraceAsString(),
            ]);

            $this->cronLog('[ExchangeSession] Lỗi: ' . $e->getMessage(), 'error');

            return Command::FAILURE;
        }
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private function handleAll(): int
    {
        $result = $this->generator->syncAll();

        $headers = ['Schedules xử lý', 'Session cập nhật'];
        $rows    = [[$result['total_schedules'], $result['total_updated']]];

        $this->table($headers, $rows);
        $this->cronLog($this->buildAsciiTable($headers, $rows));

        $doneMessage = '[ExchangeSession] Hoàn thành - ' . now()->format('Y-m-d H:i:s');
        $this->info($doneMessage);
        $this->cronLog($doneMessage);

        return Command::SUCCESS;
    }

    private function handleSingle(int $scheduleId): int
    {
        $schedule = $this->scheduleRepository->find($scheduleId);

        if (!$schedule) {
            $msg = "Không tìm thấy PlayingSchedule #{$scheduleId}.";
            $this->error($msg);
            $this->cronLog('[ExchangeSession] ' . $msg, 'error');
            return Command::FAILURE;
        }

        $updated = $this->generator->syncUpcomingForSchedule($schedule);

        $headers = ['Schedule ID', 'Weekday', 'Cập nhật'];
        $rows    = [[$schedule->id, $schedule->weekday, $updated]];

        $this->table($headers, $rows);
        $this->cronLog($this->buildAsciiTable($headers, $rows));

        $doneMessage = '[ExchangeSession] Hoàn thành - ' . now()->format('Y-m-d H:i:s');
        $this->info($doneMessage);
        $this->cronLog($doneMessage);

        return Command::SUCCESS;
    }

    private function rotateCronLogIfNeeded(): void
    {
        $path = storage_path('logs/cron/SyncExchangeSessionsCommand.log');

        if (file_exists($path) && now()->diffInDays(\Carbon\Carbon::createFromTimestamp(filemtime($path))) >= 14) {
            unlink($path);
        }
    }

    private function cronLog(string $message, string $level = 'info'): void
    {
        Log::channel('cron_sync_exchange_session')->{$level}($message);
    }

    private function buildAsciiTable(array $headers, array $rows): string
    {
        $widths = array_map('mb_strlen', $headers);

        foreach ($rows as $row) {
            foreach ($row as $i => $cell) {
                $widths[$i] = max($widths[$i], mb_strlen((string) $cell));
            }
        }

        $separator = '+' . implode('+', array_map(fn($w) => str_repeat('-', $w + 2), $widths)) . '+';

        $formatRow = function (array $cells) use ($widths): string {
            $parts = [];
            foreach ($cells as $i => $cell) {
                $cell    = (string) $cell;
                $padding = $widths[$i] - mb_strlen($cell);
                $parts[] = ' ' . $cell . str_repeat(' ', $padding) . ' ';
            }
            return '|' . implode('|', $parts) . '|';
        };

        $lines   = [];
        $lines[] = $separator;
        $lines[] = $formatRow($headers);
        $lines[] = $separator;
        foreach ($rows as $row) {
            $lines[] = $formatRow(array_values($row));
        }
        $lines[] = $separator;

        return implode("\n", $lines);
    }
}

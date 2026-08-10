<?php

// app/Console/Commands/GenerateExchangeSessionsCommand

namespace App\Console\Commands;

use App\Domains\ExchangeSession\Services\ExchangeSessionGeneratorService;
use App\Domains\ExchangeSession\Services\ExchangeSessionService;
use App\Domains\PlayingSchedule\Repositories\PlayingScheduleRepository;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class GenerateExchangeSessionsCommand extends Command
{
    protected $signature = 'exchange-sessions:generate
                            {--schedule-id= : Chỉ generate cho 1 PlayingSchedule cụ thể (dùng khi test tay)}';

    protected $description = 'Sinh ExchangeSession mới và tự động chốt các buổi đã qua giờ kết thúc';

    public function __construct(
        protected ExchangeSessionGeneratorService $generator,
        protected PlayingScheduleRepository $scheduleRepository,
        protected ExchangeSessionService $sessionService,
    ) {
        parent::__construct();
    }

    public function handle(): int
    {
        $this->rotateCronLogIfNeeded(); // ← thêm dòng này

        $this->info('[ExchangeSession] Bắt đầu generate...');
        $this->cronLog('[ExchangeSession] Bắt đầu generate...');

        try {
            if ($scheduleId = $this->option('schedule-id')) {
                return $this->handleSingle((int) $scheduleId);
            }

            return $this->handleAll();
        } catch (\Throwable $e) {
            $this->error('[ExchangeSession] Lỗi: '.$e->getMessage());

            Log::error('[Cron] exchange-sessions:generate failed', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $this->cronLog('[ExchangeSession] Lỗi: '.$e->getMessage(), 'error');

            return Command::FAILURE;
        }
    }

    // ── Private ──────────────────────────────────────────────────────────────

    private function handleAll(): int
    {
        // Complete trước để session vừa kết thúc không chiếm quota weeks_ahead.
        $completion = $this->sessionService->completeExpiredUpcoming();
        $result = $this->generator->generateAll();

        $headers = ['Schedules xử lý', 'Session tạo mới', 'Session bỏ qua', 'Đã complete', 'Complete lỗi'];
        $rows = [[
            $result['total_schedules'],
            $result['total_created'],
            $result['total_skipped'],
            $completion['completed'],
            $completion['failed'],
        ]];

        $this->table($headers, $rows);
        $this->cronLog($this->buildAsciiTable($headers, $rows));

        $doneMessage = '[ExchangeSession] Hoàn thành - '.now()->format('Y-m-d H:i:s');
        $this->info($doneMessage);
        $this->cronLog($doneMessage);

        return Command::SUCCESS;
    }

    private function handleSingle(int $scheduleId): int
    {
        $schedule = $this->scheduleRepository->find($scheduleId);

        if (! $schedule) {
            $msg = "Không tìm thấy PlayingSchedule #{$scheduleId}.";
            $this->error($msg);
            $this->cronLog('[ExchangeSession] '.$msg, 'error');

            return Command::FAILURE;
        }

        $completion = $this->sessionService->completeExpiredUpcoming($schedule->id);
        ['created' => $created, 'skipped' => $skipped] =
            $this->generator->generateForSchedule($schedule);

        $headers = ['Schedule ID', 'Weekday', 'Tạo mới', 'Bỏ qua', 'Đã complete', 'Complete lỗi'];
        $rows = [[
            $schedule->id,
            $schedule->weekday,
            $created,
            $skipped,
            $completion['completed'],
            $completion['failed'],
        ]];

        $this->table($headers, $rows);
        $this->cronLog($this->buildAsciiTable($headers, $rows));

        $doneMessage = '[ExchangeSession] Hoàn thành - '.now()->format('Y-m-d H:i:s');
        $this->info($doneMessage);
        $this->cronLog($doneMessage);

        return Command::SUCCESS;
    }

    private function rotateCronLogIfNeeded(): void
    {
        $path = storage_path('logs/cron/GenerateExchangeSessionsCommand.log');

        if (file_exists($path) && now()->diffInDays(Carbon::createFromTimestamp(filemtime($path))) >= 14) {
            unlink($path);
        }
    }

    private function cronLog(string $message, string $level = 'info'): void
    {
        Log::channel('cron_generate_exchange_session')->{$level}($message);
    }

    private function buildAsciiTable(array $headers, array $rows): string
    {
        $widths = array_map('mb_strlen', $headers);

        foreach ($rows as $row) {
            foreach ($row as $i => $cell) {
                $widths[$i] = max($widths[$i], mb_strlen((string) $cell));
            }
        }

        $separator = '+'.implode('+', array_map(fn ($w) => str_repeat('-', $w + 2), $widths)).'+';

        $formatRow = function (array $cells) use ($widths): string {
            $parts = [];
            foreach ($cells as $i => $cell) {
                $cell = (string) $cell;
                $padding = $widths[$i] - mb_strlen($cell);
                $parts[] = ' '.$cell.str_repeat(' ', $padding).' ';
            }

            return '|'.implode('|', $parts).'|';
        };

        $lines = [];
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

<?php

//app/Console/Kernel.php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
use Illuminate\Support\Facades\Log;

class Kernel extends ConsoleKernel
{
    protected function schedule(Schedule $schedule): void
    {
        $schedule
            ->command('exchange-sessions:generate')
            ->dailyAt('00:05')          // Chạy hàng ngày 00:05 — idempotency đảm bảo không tạo trùng
            ->withoutOverlapping(10)    // Không chạy song song, timeout lock 10 phút
            ->runInBackground()
            ->onFailure(function () {
                Log::error('[Cron] exchange-sessions:generate FAILED');
            })
            ->onSuccess(function () {
                Log::info('[Cron] exchange-sessions:generate SUCCESS');
            });
    }

    protected function commands(): void
    {
        $this->load(__DIR__ . '/Commands');
        require base_path('routes/console.php');
    }
}

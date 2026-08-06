<?php

use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schedule;

Schedule::command('exchange-sessions:generate')
    ->dailyAt('00:05')
    ->withoutOverlapping(10)
    ->runInBackground()
    ->onFailure(fn() => Log::error('[Cron] exchange-sessions:generate FAILED'))
    ->onSuccess(fn() => Log::info('[Cron] exchange-sessions:generate SUCCESS'));

Schedule::command('exchange-sessions:sync')
    ->dailyAt('00:10')
    ->withoutOverlapping(10)
    ->runInBackground()
    ->onFailure(fn() => Log::error('[Cron] exchange-sessions:sync FAILED'))
    ->onSuccess(fn() => Log::info('[Cron] exchange-sessions:sync SUCCESS'));

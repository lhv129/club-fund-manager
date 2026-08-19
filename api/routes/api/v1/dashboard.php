<?php

use App\Domains\Dashboard\Club\Controllers\DashboardController;
use Illuminate\Support\Facades\Route;


Route::middleware('auth.jwt')->group(function () {
    Route::prefix('dashboard')->group(function () {
        Route::get('/memberStats', [DashboardController::class, 'memberStats'])->middleware('perm.club:dashboard,view');
        Route::get('/fundPeriods', [DashboardController::class, 'fundPeriods'])->middleware('perm.club:dashboard,view');
        Route::get('/fundBalance', [DashboardController::class, 'fundBalance'])->middleware('perm.club:dashboard,view');
        Route::get('/contributions', [DashboardController::class, 'contributions'])->middleware('perm.club:dashboard,view');
        Route::get('/sessions', [DashboardController::class, 'sessions'])->middleware('perm.club:dashboard,view');
        Route::get('/transactions', [DashboardController::class, 'transactions'])->middleware('perm.club:dashboard,view');
        Route::get('/cashFlow', [DashboardController::class, 'cashFlow'])->middleware('perm.club:dashboard,view');
        Route::get('/activity', [DashboardController::class, 'activity'])->middleware('perm.club:dashboard,view');
    });
});

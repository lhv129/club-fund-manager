<?php

use App\Domains\PlayingSchedule\Controllers\PlayingScheduleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {
    Route::prefix('clubs/{clubSlug}/playing-schedules')->group(function () {
        // Tĩnh trước — bắt buộc đứng trước /{id}
        Route::get('/cursor', [PlayingScheduleController::class, 'cursorIndex'])->middleware('perm.club:playing_schedule,view');
        Route::get('/select', [PlayingScheduleController::class, 'select'])->middleware('perm.club:playing_schedule,view');

        // Dynamic sau
        Route::get('/', [PlayingScheduleController::class, 'index'])->middleware('perm.club:playing_schedule,view');
        Route::get('/{id}', [PlayingScheduleController::class, 'show'])->middleware('perm.club:playing_schedule,view');
        Route::post('/', [PlayingScheduleController::class, 'store'])->middleware('perm.club:playing_schedule,create');
        Route::put('/{id}', [PlayingScheduleController::class, 'update'])->middleware('perm.club:playing_schedule,update');
        Route::delete('/{id}', [PlayingScheduleController::class, 'destroy'])->middleware('perm.club:playing_schedule,delete');
        Route::patch('/{id}/toggle-status', [PlayingScheduleController::class, 'toggleStatus'])->middleware('perm.club:playing_schedule,update');
    });
});

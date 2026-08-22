<?php

use App\Domains\Notification\Controllers\NotificationController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('notifications')->group(function () {
    Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
    Route::post('/read-all', [NotificationController::class, 'markAllRead']);
    Route::get('/', [NotificationController::class, 'index']);
    Route::post('/{id}/read', [NotificationController::class, 'markRead']);
    Route::delete('/{id}', [NotificationController::class, 'destroy']);
});

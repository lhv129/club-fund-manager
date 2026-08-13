<?php

use App\Domains\WebhookConfig\Controllers\WebhookConfigController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->group(function () {
    Route::prefix('webhook-configs')->group(function () {
        // Tĩnh trước — bắt buộc đứng trước /{id}
        Route::get('/cursor', [WebhookConfigController::class, 'cursorIndex'])->middleware('perm.club:webhook_config,view');
        Route::get('/select', [WebhookConfigController::class, 'select'])->middleware('perm.club:webhook_config,view');
        // Dynamic sau
        Route::get('/', [WebhookConfigController::class, 'index'])->middleware('perm.club:webhook_config,view');
        Route::get('/{id}', [WebhookConfigController::class, 'show'])->middleware('perm.club:webhook_config,view');
        Route::post('/', [WebhookConfigController::class, 'store'])->middleware('perm.club:webhook_config,create');
        Route::put('/{id}', [WebhookConfigController::class, 'update'])->middleware('perm.club:webhook_config,update');
        Route::delete('/{id}', [WebhookConfigController::class, 'destroy'])->middleware('perm.club:webhook_config,delete');
        Route::patch('/{id}/toggle-status', [WebhookConfigController::class, 'toggleStatus'])->middleware('perm.club:webhook_config,update');
    });
});

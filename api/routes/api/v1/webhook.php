<?php

use App\Domains\Webhook\Controllers\CassoWebhookController;
use App\Domains\Webhook\Controllers\SePayWebhookController;
use Illuminate\Support\Facades\Route;


Route::post('/casso/webhook', [CassoWebhookController::class, 'receive']);
Route::post('/sepay/webhook', [SePayWebhookController::class, 'receive']);
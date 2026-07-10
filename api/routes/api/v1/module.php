<?php

use App\Domains\Module\Controllers\ModuleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('modules')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/', [ModuleController::class, 'index'])->middleware('permission:module,view');
    Route::get('/select',   [ModuleController::class, 'select'])->middleware('permission:module,view');
    Route::get('/{id}', [ModuleController::class, 'show'])->middleware('permission:module,view');

    // ── Write ─────────────────────────────────────────────────────────────
    Route::post('/', [ModuleController::class, 'store'])->middleware('permission:module,create');
    Route::put('/{id}', [ModuleController::class, 'update'])->middleware('permission:module,update');
    Route::delete('/{id}',  [ModuleController::class, 'destroy'])->middleware('permission:module,delete');
    Route::post('/{id}/toggle-status',   [ModuleController::class, 'toggleStatus'])->middleware('permission:module,update');
});

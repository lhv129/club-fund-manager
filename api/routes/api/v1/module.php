<?php

use App\Domains\Module\Controllers\ModuleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('modules')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/select', [ModuleController::class, 'select'])->middleware('perm.system:module,view');
    Route::get('/', [ModuleController::class, 'index'])->middleware('perm.system:module,view');
    Route::get('/{id}', [ModuleController::class, 'show'])->middleware('perm.system:module,view');

    // ── Write ─────────────────────────────────────────────────────────────
    Route::post('/', [ModuleController::class, 'store'])->middleware('perm.system:module,create');
    Route::put('/{id}', [ModuleController::class, 'update'])->middleware('perm.system:module,update');
    Route::delete('/{id}', [ModuleController::class, 'destroy'])->middleware('perm.system:module,delete');
    Route::post('/{id}/toggle-status', [ModuleController::class, 'toggleStatus'])->middleware('perm.system:module,update');
});

<?php

use App\Domains\Role\Controllers\RoleController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('roles')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/',                      [RoleController::class, 'index'])->middleware('permission:role,view');
    Route::get('/select',                [RoleController::class, 'select'])->middleware('permission:role,view');
    Route::get('/{id}',                  [RoleController::class, 'show'])->middleware('permission:role,view');

    // ── Write ─────────────────────────────────────────────────────────────
    Route::post('/',                     [RoleController::class, 'store'])->middleware('permission:role,create');
    Route::put('/{id}',                  [RoleController::class, 'update'])->middleware('permission:role,update');
    Route::delete('/{id}',               [RoleController::class, 'destroy'])->middleware('permission:role,delete');
    Route::post('/{id}/toggle-status',   [RoleController::class, 'toggleStatus'])->middleware('permission:role,update');

    // ── Permissions sync ───────────────────────────────────────────────────
    Route::post('/{id}/permissions',     [RoleController::class, 'syncPermissions'])->middleware('permission:role,update');
});

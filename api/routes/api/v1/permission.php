<?php

use App\Domains\Permission\Controllers\PermissionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('permissions')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/', [PermissionController::class, 'index'])->middleware('permission:permission,view');
    Route::get('/by-module', [PermissionController::class, 'byModule'])->middleware('permission:permission,view');
    Route::get('/{id}',  [PermissionController::class, 'show'])->middleware('permission:permission,view');

    // ── Write ─────────────────────────────────────────────────────────────
    Route::post('/', [PermissionController::class, 'store'])->middleware('permission:permission,create');
    Route::put('/{id}',  [PermissionController::class, 'update'])->middleware('permission:permission,update');
    Route::delete('/{id}', [PermissionController::class, 'destroy'])->middleware('permission:permission,delete');
    Route::post('/{id}/toggle-status',   [PermissionController::class, 'toggleStatus'])->middleware('permission:permission,update');
});

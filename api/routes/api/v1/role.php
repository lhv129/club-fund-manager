<?php

use App\Domains\Role\Controllers\RoleController;
use App\Domains\Role\Controllers\RolePermissionController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('roles')->group(function () {
    // ── Read ──────────────────────────────────────────────────────────────
    Route::get('/', [RoleController::class, 'index'])->middleware('perm.system:role,view');
    Route::get('/select', [RoleController::class, 'select'])->middleware('perm.system:role,view');
    Route::get('/{id}', [RoleController::class, 'show'])->middleware('perm.system:role,view');
    Route::get('/slug/{slug}', [RoleController::class, 'getBySlug'])->middleware('perm.system:role,view');
    Route::get('/{slug}/permissions', [RoleController::class, 'getPermissionsBySlug'])->middleware('perm.system:role,view');

    // ── Write ─────────────────────────────────────────────────────────────
    Route::post('/', [RoleController::class, 'store'])->middleware('perm.system:role,create');
    Route::put('/{id}', [RoleController::class, 'update'])->middleware('perm.system:role,update');
    Route::delete('/{id}', [RoleController::class, 'destroy'])->middleware('perm.system:role,delete');
    Route::post('/{id}/toggle-status',   [RoleController::class, 'toggleStatus'])->middleware('perm.system:role,update');

    // ── Permissions sync ───────────────────────────────────────────────────
    Route::post('/syncPermissions',     [RolePermissionController::class, 'syncPermissions'])->middleware('perm.system:role,update');
});

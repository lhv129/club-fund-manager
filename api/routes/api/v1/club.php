<?php

use App\Domains\Club\Controllers\ClubController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('clubs')->group(function () {
    // Index — mọi user đã login đều được xem (service tự filter theo quyền)
    Route::get('/', [ClubController::class, 'index']);
    Route::get('/cursor', [ClubController::class, 'cursorIndex']);
    Route::get('/select', [ClubController::class, 'select']);

    // Xem chi tiết 1 club — check club scope qua clubId
    Route::get('/slug/{slug}', [ClubController::class, 'showBySlug'])->middleware('permission.club:club,view');;  // resolve trong controller
    Route::get('/{id}', [ClubController::class, 'show'])->middleware('permission.club:club,view');

    // Write — system scope (chỉ superadmin/admin)
    Route::post('/', [ClubController::class, 'store'])->middleware('permission:club,create');
    Route::put('/{id}', [ClubController::class, 'update'])->middleware('permission:club,update');
    Route::delete('/{id}', [ClubController::class, 'destroy'])->middleware('permission:club,delete');
    Route::post('/{id}/toggle-status', [ClubController::class, 'toggleStatus'])->middleware('permission:club,update');
    Route::put('/{id}/owner', [ClubController::class, 'updateOwner'])->middleware('permission:club,update');
});

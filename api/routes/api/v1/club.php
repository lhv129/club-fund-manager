<?php

use App\Domains\Club\Controllers\ClubController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('clubs')->group(function () {

    // Index — mọi user đã login đều được xem (service tự filter theo quyền)
    Route::get('/', [ClubController::class, 'index']);
    Route::get('/select', [ClubController::class, 'select']);
    Route::get('/cursor', [ClubController::class, 'cursorIndex']);


    // Xem chi tiết 1 club — check club scope qua clubId
    Route::get('/slug/{slug}', [ClubController::class, 'showBySlug'])->middleware('perm.club:club,view');
    Route::get('/{id}', [ClubController::class, 'show'])->middleware('perm.club:club,view');

    // Write — system scope (chỉ superadmin/admin)
    Route::post('/', [ClubController::class, 'store'])->middleware('perm.system:club,create');
    Route::put('/{id}', [ClubController::class, 'update'])->middleware('perm.club:club,update');
    Route::delete('/{id}', [ClubController::class, 'destroy'])->middleware('perm.club:club,delete');
    Route::post('/{id}/toggle-status', [ClubController::class, 'toggleStatus'])->middleware('perm.club:club,update');
    Route::put('/{id}/owner', [ClubController::class, 'updateOwner'])->middleware('perm.system:club,update');
});

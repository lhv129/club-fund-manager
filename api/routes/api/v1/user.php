<?php

use App\Domains\User\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('users')->group(function () {
    Route::get('/',                 [UserController::class, 'index'])->middleware('perm.system:user,view');
    Route::get('/active',           [UserController::class, 'activeIndex'])->middleware('perm.system:user,view');
    Route::get('/cursor',           [UserController::class, 'cursorIndex'])->middleware('perm.system:user,view');
    Route::get('/select',           [UserController::class, 'select'])->middleware('perm.system:user,view');
    Route::post('/',                [UserController::class, 'store'])->middleware('perm.system:user,create');
    Route::get('/{id}',             [UserController::class, 'show'])->middleware('perm.system:user,view');
    Route::put('/{id}',             [UserController::class, 'update'])->middleware('perm.system:user,update');
    Route::delete('/{id}',          [UserController::class, 'destroy'])->middleware('perm.system:user,delete');
    Route::patch('/{id}/status', [UserController::class, 'updateStatus'])->middleware('perm.system:user,update');
});

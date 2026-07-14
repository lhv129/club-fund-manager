<?php

use App\Domains\User\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth.jwt')->prefix('users')->group(function () {
    Route::get('/',                 [UserController::class, 'index'])->middleware('permission:user,view');
    Route::get('/active',           [UserController::class, 'activeIndex'])->middleware('permission:user,view');
    Route::get('/cursor',           [UserController::class, 'cursorIndex'])->middleware('permission:user,view');
    Route::get('/select',           [UserController::class, 'select'])->middleware('permission:user,view');
    Route::post('/',                [UserController::class, 'store'])->middleware('permission:user,create');
    Route::get('/{id}',             [UserController::class, 'show'])->middleware('permission:user,view');
    Route::put('/{id}',             [UserController::class, 'update'])->middleware('permission:user,update');
    Route::delete('/{id}',          [UserController::class, 'destroy'])->middleware('permission:user,delete');
    Route::patch('/{id}/toggle-status', [UserController::class, 'toggleStatus'])->middleware('permission:user,update');
});

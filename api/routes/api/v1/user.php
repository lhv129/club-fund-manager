<?php

use App\Domains\User\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('users')->group(function () {
    Route::get('/',[UserController::class, 'index']);
    Route::get('/active',[UserController::class, 'activeIndex']);
    Route::get('/cursor',[UserController::class, 'cursorIndex']); 
    Route::get('/select',[UserController::class, 'select']);
    Route::post('/',[UserController::class, 'store']);
    Route::get('/{id}',[UserController::class, 'show']);
    Route::put('/{id}',[UserController::class, 'update']);
    Route::delete('/{id}',[UserController::class, 'destroy']);
    Route::patch('/{id}/toggle-status', [UserController::class, 'toggleStatus']);
});

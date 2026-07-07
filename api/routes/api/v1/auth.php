<?php

use App\Domains\Auth\Controllers\AuthController;
use App\Domains\Auth\Controllers\LoginController;
use App\Domains\Auth\Controllers\RegisterController;
use Illuminate\Support\Facades\Route;


Route::prefix('auth')->group(function () {
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/register', [RegisterController::class, 'register']);

    Route::post('/refresh', [AuthController::class, 'refresh']);
    Route::middleware('auth.jwt')->group(function () {
        Route::get('/profile', [AuthController::class, 'profile']);
    });
});

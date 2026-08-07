<?php

use App\Domains\Bank\Controllers\BankAccountController;
use Illuminate\Support\Facades\Route;


Route::middleware('auth.jwt')->group(function () {
    Route::prefix('clubs/{clubSlug}/bank-accounts')->group(function () {
        Route::get('/', [BankAccountController::class, 'index'])->middleware('perm.club:bank_account,view');
        Route::get('/{id}', [BankAccountController::class, 'show'])->middleware('perm.club:bank_account,view');
        Route::post('/', [BankAccountController::class, 'store'])->middleware('perm.club:bank_account,create');
        Route::put('/{id}', [BankAccountController::class, 'update'])->middleware('perm.club:bank_account,update');
        Route::delete('/{id}', [BankAccountController::class, 'destroy'])->middleware('perm.club:bank_account,delete');
        Route::post('/{id}/toggle-status', [BankAccountController::class, 'toggleStatus'])->middleware('perm.club:bank_account,update');
        Route::post('/{id}/toggle-default', [BankAccountController::class, 'toggleDefault'])->middleware('perm.club:bank_account,update');
    });
});

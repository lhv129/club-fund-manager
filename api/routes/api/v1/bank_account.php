<?php

use App\Domains\BankAccount\Controllers\BankAccountController;
use Illuminate\Support\Facades\Route;

// Example là module reference/demo — chỉ cần đăng nhập, không check perm.system
Route::middleware('auth.jwt')->prefix('bank-accounts')->group(function () {

    // Tĩnh trước — bắt buộc đứng trước /{id}
    Route::get('/cursor',       [BankAccountController::class, 'cursorIndex'])->middleware('perm.club:bank_account,view');
    Route::get('/select',       [BankAccountController::class, 'select'])->middleware('perm.club:bank_account,view');
    Route::get('/slug/{slug}',  [BankAccountController::class, 'showBySlug'])->middleware('perm.club:bank_account,view');
    Route::post('/reorder',     [BankAccountController::class, 'reorder'])->middleware('perm.club:bank_account,update');

    // Dynamic sau
    Route::get('/', [BankAccountController::class, 'index'])->middleware('perm.club:bank_account,view');
    Route::get('/{id}', [BankAccountController::class, 'show'])->middleware('perm.club:bank_account,view');
    Route::post('/', [BankAccountController::class, 'store'])->middleware('perm.club:bank_account,create');
    Route::put('/{id}', [BankAccountController::class, 'update'])->middleware('perm.club:bank_account,update');
    Route::delete('/{id}', [BankAccountController::class, 'destroy'])->middleware('perm.club:bank_account,delete');
    Route::patch('/{id}/toggle-status', [BankAccountController::class, 'toggleStatus'])->middleware('perm.club:bank_account,update');
});

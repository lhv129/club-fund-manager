<?php

use App\Domains\MemberPaymentCode\Controllers\MemberPaymentCodeController;
use Illuminate\Support\Facades\Route;

/*
 * MemberPaymentCode là code thanh toán do hệ thống sinh (read-only + generate).
 * - GET  /payment-codes                          — list (admin)
 * - GET  /payment-codes/{id}                      — detail
 * - GET  /monthly-contributions/{contributionId}/payment-code  — code active của contribution
 * - POST /monthly-contributions/{contributionId}/payment-code  — sinh / làm mới code
 */

Route::middleware('auth.jwt')->prefix('payment-codes')->group(function () {
    // List + detail (read-only)
    Route::get('/',     [MemberPaymentCodeController::class, 'index'])->middleware('perm.club:member_payment_code,view');
    Route::get('/{paymentCode}', [MemberPaymentCodeController::class, 'getByPaymentCode'])->middleware('perm.club:member_payment_code,view');
});

Route::middleware('auth.jwt')->prefix('monthly-contributions')->group(function () {
    // Endpoint sinh mã thanh toán — chỉ chủ sở hữu
    Route::post('/{contributionId}/payment-code', [MemberPaymentCodeController::class, 'generateOrReuse'])->middleware('perm.club:member_payment_code,view');
});

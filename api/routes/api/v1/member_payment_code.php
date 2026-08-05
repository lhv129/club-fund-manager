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

Route::middleware('auth.jwt')->prefix('clubs/{clubSlug}/payment-codes')->group(function () {
    // List + detail (read-only)
    Route::get('/',     [MemberPaymentCodeController::class, 'index'])->middleware('perm.club:member_payment_code,view');
    Route::get('/{id}', [MemberPaymentCodeController::class, 'show'])->middleware('perm.club:member_payment_code,view');
});

Route::middleware('auth.jwt')->prefix('clubs/{clubSlug}/monthly-contributions')->group(function () {
    // Sub-resource trên monthly-contributions: show + generate code
    Route::get('/{contributionId}/payment-code',  [MemberPaymentCodeController::class, 'showForContribution'])->middleware('perm.club:member_payment_code,view');
    Route::post('/{contributionId}/payment-code', [MemberPaymentCodeController::class, 'generateForContribution'])->middleware('perm.club:member_payment_code,update');
});

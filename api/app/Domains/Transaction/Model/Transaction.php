<?php

namespace App\Domains\Transaction\Models;

use App\Domains\BankAccount\Models\BankAccount;
use App\Domains\Club\Models\Club;
use App\Domains\MemberPaymentCode\Models\MemberPaymentCode;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'bank_account_id',
        'payment_code_id',     // MemberPaymentCode (nullable — nếu match được)
        'user_id',             // nullable — nếu match được qua payment_code
        'amount',
        'type',                // 'income' | 'expense'
        'description',         // nội dung gốc từ webhook / nhập tay
        'transaction_date',
        'reference_code',      // mã tham chiếu từ ngân hàng
        'status',              // 'pending' | 'confirmed' | 'rejected'
        'note',                // ghi chú thêm của admin
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount'           => 'decimal:2',
            'transaction_date' => 'datetime',
            'is_active'        => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function bankAccount()
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function paymentCode()
    {
        return $this->belongsTo(MemberPaymentCode::class, 'payment_code_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function monthlyContributions()
    {
        return $this->hasMany(MonthlyContribution::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeIncome($query)
    {
        return $query->where('type', 'income');
    }

    public function scopeExpense($query)
    {
        return $query->where('type', 'expense');
    }

    public function scopeConfirmed($query)
    {
        return $query->where('status', 'confirmed');
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}

<?php

namespace App\Domains\MonthlyContribution\Models;

use App\Domains\Club\Models\Club;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class MonthlyContribution extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'user_id',
        'transaction_id',   // nullable — gắn với giao dịch thực tế sau khi confirm
        'year',
        'month',
        'amount',
        'status',           // 'unpaid' | 'paid' | 'waived'
        'note',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount'    => 'decimal:2',
            'year'      => 'integer',
            'month'     => 'integer',
            'is_active' => 'boolean',
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

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function transaction()
    {
        return $this->belongsTo(Transaction::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopePaid($query)
    {
        return $query->where('status', 'paid');
    }

    public function scopeUnpaid($query)
    {
        return $query->where('status', 'unpaid');
    }

    public function scopeOfMonth($query, int $year, int $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }
}

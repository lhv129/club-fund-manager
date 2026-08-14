<?php

namespace App\Domains\MonthlyContribution\Models;

use App\Domains\Club\Models\Club;
use App\Domains\FundPeriod\Models\FundPeriod;
use App\Domains\MemberPaymentCode\Models\MemberPaymentCode;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class MonthlyContribution extends Model
{
    use HasFactory, SoftDeletes;


    protected $fillable = [
        'club_id',
        'user_id',

        'period_id',           // FK tới fund_periods — thay cho year/month

        'transaction_id',      // nullable - gắn sau khi thanh toán thành công

        'amount',

        'status',              // pending | paid | cancelled

        'paid_by',             // bank | cash | manual

        'payment_date',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'period_id' => 'integer',
            'payment_date' => 'datetime',
            'is_active' => 'boolean',
        ];
    }


    /*
|--------------------------------------------------------------------------
| State constants
|--------------------------------------------------------------------------
*/

    public const STATUS_PENDING = 'pending';
    public const STATUS_PAID = 'paid';
    public const STATUS_CANCELLED = 'cancelled';

    public const IS_ACTIVE = 1;
    public const IS_INACTIVE = 0;


    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(FundPeriod::class, 'period_id');
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    /**
     * Một khoản đóng quỹ chỉ sinh ra một payment code.
     */
    public function paymentCode(): HasOne
    {
        return $this->hasOne(MemberPaymentCode::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePending(Builder $query): Builder
    {
        return $query->where('status', 'pending');
    }

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('status', 'paid');
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeOfPeriod(Builder $query, int $periodId): Builder
    {
        return $query->where('period_id', $periodId);
    }
}

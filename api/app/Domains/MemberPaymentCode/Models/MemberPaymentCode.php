<?php

namespace App\Domains\MemberPaymentCode\Models;

use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class MemberPaymentCode extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'monthly_contribution_id',

        'payment_code',

        'status',          // pending | used | expired

        'expired_at',
        'used_at',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'expired_at' => 'datetime',
            'used_at' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function monthlyContribution(): BelongsTo
    {
        return $this->belongsTo(MonthlyContribution::class);
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

    public function scopeUsed(Builder $query): Builder
    {
        return $query->where('status', 'used');
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->where('status', 'expired');
    }
}

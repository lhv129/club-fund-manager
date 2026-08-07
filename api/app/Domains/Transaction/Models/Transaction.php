<?php

namespace App\Domains\Transaction\Models;

use App\Domains\Bank\Models\BankAccount;
use App\Domains\Club\Models\Club;
use App\Domains\MonthlyContribution\Models\MonthlyContribution;
use App\Domains\User\Models\User;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Transaction extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'user_id',              // nullable - xác định sau khi match payment code
        'bank_account_id',
        'webhook_config_id',

        'source',               // webhook | cash | manual
        'type',                 // income | expense

        'amount',
        'balance',

        'reference_code',
        'sender_name',
        'sender_account',
        'description',

        'transaction_date',

        'raw_payload',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
            'balance' => 'decimal:2',
            'raw_payload' => 'array',
            'transaction_date' => 'datetime',
            'is_active' => 'boolean',
        ];
    }

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

    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }

    public function webhookConfig(): BelongsTo
    {
        return $this->belongsTo(WebhookConfig::class);
    }

    public function monthlyContributions(): HasMany
    {
        return $this->hasMany(MonthlyContribution::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeIncome(Builder $query): Builder
    {
        return $query->where('type', 'income');
    }

    public function scopeExpense(Builder $query): Builder
    {
        return $query->where('type', 'expense');
    }

    public function scopeWebhook(Builder $query): Builder
    {
        return $query->where('source', 'webhook');
    }

    public function scopeCash(Builder $query): Builder
    {
        return $query->where('source', 'cash');
    }

    public function scopeManual(Builder $query): Builder
    {
        return $query->where('source', 'manual');
    }
}

<?php

namespace App\Domains\BankAccount\Models;

use App\Domains\Club\Models\Club;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\SoftDeletes;

class BankAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'bank_code',
        'bank_name',
        'account_number',
        'account_holder',
        'qr_image',
        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'sort_order' => 'integer',
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

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }

    public function webhookConfigs(): HasMany
    {
        return $this->hasMany(WebhookConfig::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }
}

<?php

namespace App\Domains\Webhook\Models;

use App\Domains\BankAccount\Models\BankAccount;
use App\Domains\Club\Models\Club;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebhookConfig extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'bank_account_id',
        'provider',         // 'casso' | 'sepay' | ...
        'api_key',          // encrypted
        'is_active',
    ];

    protected $hidden = ['api_key'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'api_key'   => 'encrypted',
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

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }

    public function scopeProvider($query, string $provider)
    {
        return $query->where('provider', $provider);
    }
}

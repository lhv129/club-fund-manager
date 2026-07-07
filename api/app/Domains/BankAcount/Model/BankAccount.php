<?php

namespace App\Domains\BankAccount\Models;

use App\Domains\Club\Models\Club;
use App\Domains\Transaction\Models\Transaction;
use App\Domains\Webhook\Models\WebhookConfig;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BankAccount extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'bank_name',
        'account_number',
        'account_name',
        'branch',           // chi nhánh (nullable)
        'is_active',
    ];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
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

    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    public function webhookConfigs()
    {
        return $this->hasMany(WebhookConfig::class);
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
}

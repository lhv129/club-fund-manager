<?php

namespace App\Domains\WebhookConfig\Models;

use App\Domains\BankAccount\Models\BankAccount;
use App\Domains\Club\Models\Club;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class WebhookConfig extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'webhook_configs';

    protected $fillable = [
        'club_id',
        'bank_account_id',
        'type',
        'api_key',
        'webhook_secret',
        'webhook_url',
        'webhook_token',
        'is_verified',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'club_id'         => 'integer',
        'bank_account_id' => 'integer',
        'is_verified'     => 'boolean',
        'is_active'       => 'boolean',
        'sort_order'      => 'integer',
        'api_key'         => 'encrypted',
    ];

    /**
     * Ẩn api_key khỏi response mặc định (dù đã encrypted, vẫn không trả ra client).
     */
    protected $hidden = ['api_key'];

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    /**
     * Chỉ lấy webhook đang active.
     */
    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * Chỉ lấy webhook đang inactive.
     */
    public function scopeInactive(Builder $query): Builder
    {
        return $query->where('is_active', false);
    }

    /**
     * Chỉ lấy webhook đã verify.
     */
    public function scopeVerified(Builder $query): Builder
    {
        return $query->where('is_verified', true);
    }

    /**
     * Chỉ lấy webhook chưa verify.
     */
    public function scopeUnverified(Builder $query): Builder
    {
        return $query->where('is_verified', false);
    }

    /**
     * Lọc theo loại webhook.
     */
    public function scopeType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    /**
     * Lọc theo CLB.
     */
    public function scopeClub(Builder $query, int $clubId): Builder
    {
        return $query->where('club_id', $clubId);
    }

    // -------------------------------------------------------------------------
    // Relationships
    // -------------------------------------------------------------------------

    /**
     * Club sở hữu webhook.
     */
    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    /**
     * Tài khoản ngân hàng dùng để nhận webhook.
     */
    public function bankAccount(): BelongsTo
    {
        return $this->belongsTo(BankAccount::class);
    }
}

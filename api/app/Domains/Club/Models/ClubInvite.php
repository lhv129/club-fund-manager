<?php

namespace App\Domains\Club\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubInvite extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'created_by',   // user_id tạo link (admin hoặc member)
        'code',         // unique token
        'max_members',     // null = không giới hạn
        'used_count',
        'status',       // 'active' | 'expired' | 'disabled'
        'expires_at',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active'  => 'boolean',
            'expires_at' => 'datetime',
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

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function members()
    {
        return $this->hasMany(ClubMember::class, 'invite_id');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeActive($query)
    {
        return $query->where('status', 'active')
            ->where('is_active', 1)
            ->where(function ($q) {
                $q->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            });
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */
    public function isExpired(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function isFull(): bool
    {
        return $this->max_members !== null && $this->used_count >= $this->max_members;
    }

    public function isUsable(): bool
    {
        return $this->status === 'active'
            && $this->is_active
            && !$this->isExpired()
            && !$this->isFull();
    }
}

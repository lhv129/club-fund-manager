<?php

namespace App\Domains\Club\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubMember extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING = 'pending';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_REMOVED = 'removed';

    protected $fillable = [
        'club_id',
        'user_id',
        'invite_id',
        'reviewed_by',   // admin duyệt (nullable)
        'invited_by',    // user_id tạo invite link (nullable)
        'join_type',     // 'request' | 'invite'
        'rejected_reason',
        'removed_by',
        'removed_at',
        'status',        // 'pending' | 'approved' | 'rejected'
        'is_active',
        'joined_at',
        'reviewed_at',
    ];
    protected function casts(): array
    {
        return [
            'is_active'   => 'boolean',
            'joined_at'   => 'datetime',
            'reviewed_at' => 'datetime',
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
    public function invite()
    {
        return $this->belongsTo(ClubInvite::class, 'invite_id');
    }
    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
    public function removedBy()
    {
        return $this->belongsTo(User::class, 'removed_by');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeApproved($query)
    {
        return $query->where('status', 'approved')->where('is_active', 1);
    }
    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }
}

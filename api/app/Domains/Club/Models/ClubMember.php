<?php

namespace App\Domains\Club\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubMember extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = [
        'club_id',
        'user_id',
        'invited_by',    // user_id tạo invite link (nullable)
        'reviewed_by',   // admin duyệt (nullable)
        'join_type',     // 'request' | 'invite'
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
    public function invitedBy()
    {
        return $this->belongsTo(User::class, 'invited_by');
    }
    public function reviewedBy()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
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

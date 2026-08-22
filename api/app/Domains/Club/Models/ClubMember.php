<?php

namespace App\Domains\Club\Models;

use App\Domains\ClubMemberRole\Models\ClubMemberRole;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubMember extends Model
{
    use HasFactory, SoftDeletes;

    /*
    |--------------------------------------------------------------------------
    | Status
    |--------------------------------------------------------------------------
    */

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_REMOVED = 'removed';

    public const STATUS_BANNED = 'banned';

    /*
    |--------------------------------------------------------------------------
    | Join Type
    |--------------------------------------------------------------------------
    */

    public const JOIN_TYPE_REQUEST = 'request';

    public const JOIN_TYPE_INVITE = 'invite';

    /*
    |--------------------------------------------------------------------------
    | Mass Assignment
    |--------------------------------------------------------------------------
    */

    protected $fillable = [
        'club_id',
        'user_id',

        'invite_id',
        'invited_by',

        'join_type',

        'status',

        'reviewed_by',
        'reviewed_at',

        'rejected_reason',

        'removed_by',
        'removed_at',

        'banned_by',
        'banned_at',
        'banned_reason',

        'joined_at',

        'is_active',
    ];

    /*
    |--------------------------------------------------------------------------
    | Casts
    |--------------------------------------------------------------------------
    */

    protected function casts(): array
    {
        return [
            'is_active'   => 'boolean',

            'joined_at'   => 'datetime',

            'reviewed_at' => 'datetime',

            'removed_at'  => 'datetime',

            'banned_at'   => 'datetime',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    /**
     * Club mà member thuộc về.
     */
    public function club()
    {
        return $this->belongsTo(
            Club::class,
            'club_id'
        );
    }

    /**
     * User của member.
     */
    public function user()
    {
        return $this->belongsTo(
            User::class,
            'user_id'
        );
    }

    /**
     * Invite được sử dụng để join club.
     */
    public function invite()
    {
        return $this->belongsTo(
            ClubInvite::class,
            'invite_id'
        );
    }

    /**
     * User tạo invite link.
     */
    public function invitedBy()
    {
        return $this->belongsTo(
            User::class,
            'invited_by'
        );
    }

    /**
     * User/admin duyệt hoặc reject member.
     */
    public function reviewedBy()
    {
        return $this->belongsTo(
            User::class,
            'reviewed_by'
        );
    }

    /**
     * User/admin remove member.
     */
    public function removedBy()
    {
        return $this->belongsTo(
            User::class,
            'removed_by'
        );
    }

    /**
     * User/admin ban member.
     */
    public function bannedBy()
    {
        return $this->belongsTo(
            User::class,
            'banned_by'
        );
    }

    /**
     * Các role của member trong Club.
     */
    public function clubMemberRoles(): HasMany
    {
        return $this->hasMany(
            ClubMemberRole::class,
            'user_id',
            'user_id'
        )->whereColumn(
            'club_member_roles.club_id',
            'club_members.club_id'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | Status Scopes
    |--------------------------------------------------------------------------
    */

    /**
     * Approved và đang active.
     */
    public function scopeApproved($query)
    {
        return $query
            ->where('status', self::STATUS_APPROVED)
            ->where('is_active', true);
    }

    /**
     * Pending.
     */
    public function scopePending($query)
    {
        return $query->where(
            'status',
            self::STATUS_PENDING
        );
    }

    /**
     * Rejected.
     */
    public function scopeRejected($query)
    {
        return $query->where(
            'status',
            self::STATUS_REJECTED
        );
    }

    /**
     * Removed.
     */
    public function scopeRemoved($query)
    {
        return $query->where(
            'status',
            self::STATUS_REMOVED
        );
    }

    /**
     * Banned.
     */
    public function scopeBanned($query)
    {
        return $query->where(
            'status',
            self::STATUS_BANNED
        );
    }

    /**
     * Active member.
     *
     * Chỉ member approved + active.
     */
    public function scopeActive($query)
    {
        return $query
            ->where(
                'status',
                self::STATUS_APPROVED
            )
            ->where('is_active', true);
    }

    /**
     * Inactive member.
     */
    public function scopeInactive($query)
    {
        return $query->where(
            'is_active',
            false
        );
    }

    /*
    |--------------------------------------------------------------------------
    | State Helpers
    |--------------------------------------------------------------------------
    */

    /**
     * Kiểm tra pending.
     */
    public function isPending(): bool
    {
        return $this->status === self::STATUS_PENDING;
    }

    /**
     * Kiểm tra approved.
     */
    public function isApproved(): bool
    {
        return $this->status === self::STATUS_APPROVED
            && $this->is_active;
    }

    /**
     * Kiểm tra rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === self::STATUS_REJECTED;
    }

    /**
     * Kiểm tra removed.
     */
    public function isRemoved(): bool
    {
        return $this->status === self::STATUS_REMOVED;
    }

    /**
     * Kiểm tra banned.
     */
    public function isBanned(): bool
    {
        return $this->status === self::STATUS_BANNED;
    }

    /**
     * Kiểm tra có thể join/request lại hay không.
     *
     * rejected + removed được request lại.
     * banned không được request lại.
     */
    public function canRejoin(): bool
    {
        return in_array(
            $this->status,
            [
                self::STATUS_REJECTED,
                self::STATUS_REMOVED,
            ],
            true
        );
    }

    /**
     * Kiểm tra member hiện tại có active trong club không.
     */
    public function isActiveMember(): bool
    {
        return $this->status === self::STATUS_APPROVED
            && $this->is_active;
    }
}

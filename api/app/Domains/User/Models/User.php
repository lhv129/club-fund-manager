<?php

namespace App\Domains\User\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Domains\Club\Models\ClubMember;
use App\Domains\ClubMemberRole\Models\ClubMemberRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use App\Services\Authorization\PermissionService;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, SoftDeletes;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'first_name',
        'last_name',
        'fullname',
        'username',
        'date_of_birth',
        'address',
        'phone',
        'gender',
        'avatar',
        'bgImage',
        'count',
        'description',
        'email',
        'email_verified_at',
        'password',
        'status'
    ];

    /*
    |--------------------------------------------------------------------------
    | STATUS
    |--------------------------------------------------------------------------
    */
    const STATUS_PENDING = 'pending';
    const STATUS_ACTIVE  = 'active';
    const STATUS_LOCKED  = 'locked';

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }
    /*
    |--------------------------------------------------------------------------
    | JWT
    |--------------------------------------------------------------------------
    */
    public function getJWTIdentifier()
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims()
    {
        return [];
    }


    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function clubMembers()
    {
        return $this->hasMany(ClubMember::class);
    }
    public function clubMemberRoles()
    {
        return $this->hasMany(ClubMemberRole::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | Permission Helpers
    |--------------------------------------------------------------------------
    */
    /**
     * Superadmin: role slug = 'superadmin' với club_id = null (system role).
     * Auto pass tất cả permission — KHÔNG đi qua hasPermission().
     */
    public function isSuperAdmin(): bool
    {
        return app(PermissionService::class)->isSuperAdmin($this);
    }

    /**
     * Admin:  club_id = null (system scope).
     * KHÔNG bypass — vẫn phải đi qua hasPermission(), nhưng ở system scope.
     * Quyền configurable do superadmin cấp qua POST /roles/{id}/permissions.
     *
     * Lưu ý: LOẠI TRỪ superadmin — superadmin chỉ được tính ở isSuperAdmin().
     */
    public function isSystemAdmin(): bool
    {
        return app(PermissionService::class)->isSystemAdmin($this);
    }

    /**
     * Kiểm tra quyền theo module + action.
     *
     * @param string   $module   slug của module (vd: 'club', 'fund', 'user')
     * @param string   $action   action (vd: 'view', 'create', 'update', 'delete')
     * @param int|null $clubId   null = SYSTEM SCOPE (admin/role/permission/user/...)
     *                           int = CLUB SCOPE (chỉ club cụ thể)
     *
     * Lưu ý: KHÔNG fallback "any club" khi $clubId = null.
     * null  → check ở club_member_roles.club_id IS NULL (system scope).
     * int   → check ở club_member_roles.club_id = $clubId (club scope).
     */
    public function hasPermission(string $module, string $action, ?int $clubId = null): bool
    {
        return app(PermissionService::class)->hasPermission($this, $module, $action, $clubId);
    }

    /**
     * Trả về cây quyền để frontend render menu/ẩn-hiện nút.
     *
     * Format (1 object gộp, KHÔNG bao giờ là array tuần tự):
     *
     *   superadmin              → ['*']
     *
     *   admin (system scope)    → { "club": [...], "member": [...], "user": [...] }
     *   hoặc role system khác     (FLAT ở top-level — key là module slug)
     *
     *   owner/manager/member    → { "club_1": { "club":[...], "member":[...] },
     *   (club scope)               "club_2": { ... } }
     *                             (nested dưới key "club_{id}")
     *
     *   user vừa admin vừa       → { "club":[sys], "user":[sys],
     *   member của club 1, 2       "club_1": {...}, "club_2": {...} }
     *                             (merge — KHÔNG collide vì module slug
     *                              không có prefix "club_")
     *
     * Lý do key "club_{id}": JsonResource::resolve() reindex numeric string
     * keys ("1","2" → 0,1) → mất club_id. Prefix "club_" tránh reindex.
     */
    public function permissionsGroupedByClub(): array
    {
        return app(PermissionService::class)->permissionsGroupedByClub($this);
    }

    // Chưa xác thực email
    public function isPendingVerification(): bool
    {
        return $this->status === self::STATUS_PENDING || $this->email_verified_at === null;
    }

    // Tài khoản bị khóa
    public function isLocked(): bool
    {
        return $this->status === self::STATUS_LOCKED;
    }

    // Tài khoản hoạt động
    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
    }
}

<?php

namespace App\Domains\User\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Domains\Club\Models\ClubMember;
use App\Domains\Club\Models\ClubMemberRole;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\DB;
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
        return DB::table('club_member_roles')
            ->join('roles', 'roles.id', '=', 'club_member_roles.role_id')
            ->where('club_member_roles.user_id', $this->id)
            ->where('club_member_roles.is_active', 1)
            ->whereNull('club_member_roles.deleted_at')
            ->where('club_member_roles.club_id')          // system scope
            ->where('roles.slug', 'superadmin')
            ->where('roles.is_active', 1)
            ->whereNull('roles.deleted_at')
            ->exists();
    }

    /**
     * Admin: role slug = 'admin' với club_id = null (system scope).
     * KHÔNG bypass — vẫn phải đi qua hasPermission(), nhưng ở system scope.
     * Quyền configurable do superadmin cấp qua POST /roles/{id}/permissions.
     */
    public function isSystemAdmin(): bool
    {
        return DB::table('club_member_roles')
            ->join('roles', 'roles.id', '=', 'club_member_roles.role_id')
            ->where('club_member_roles.user_id', $this->id)
            ->where('club_member_roles.is_active', 1)
            ->whereNull('club_member_roles.deleted_at')
            ->where('club_member_roles.club_id')          // system scope
            ->where('roles.slug', 'admin')
            ->where('roles.is_active', 1)
            ->whereNull('roles.deleted_at')
            ->exists();
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
        // Superadmin [*] bypass tất cả
        if ($this->isSuperAdmin()) {
            return true;
        }
        $query = DB::table('club_member_roles')
            ->join('roles', function ($j) {
                $j->on('roles.id', '=', 'club_member_roles.role_id')
                    ->where('roles.is_active', 1)
                    ->whereNull('roles.deleted_at');
            })
            ->join('role_permissions', function ($j) {
                $j->on('role_permissions.role_id', '=', 'roles.id')
                    ->where('role_permissions.is_active', 1)
                    ->whereNull('role_permissions.deleted_at');
            })
            ->join('permissions', function ($j) {
                $j->on('permissions.id', '=', 'role_permissions.permission_id')
                    ->where('permissions.is_active', 1)
                    ->whereNull('permissions.deleted_at');
            })
            ->join('modules', function ($j) {
                $j->on('modules.id', '=', 'permissions.module_id')
                    ->where('modules.is_active', 1)
                    ->whereNull('modules.deleted_at');
            })
            ->where('club_member_roles.user_id', $this->id)
            ->where('club_member_roles.is_active', 1)
            ->whereNull('club_member_roles.deleted_at')
            ->where('modules.slug', $module)
            ->where('permissions.action', $action);

        // Phân tách scope — KHÔNG mix, KHÔNG fallback "any club":
        //   null → SYSTEM SCOPE (admin/role/permission/user/...)  → club_id IS NULL
        //   int  → CLUB SCOPE (chỉ club cụ thể)                    → club_id = $clubId
        if ($clubId === null) {
            $query->whereNull('club_member_roles.club_id');
        } else {
            $query->where('club_member_roles.club_id', $clubId);
        }

        return $query->exists();
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
        if ($this->isSuperAdmin()) {
            return ['*'];
        }
        $rows = DB::table('club_member_roles')
            ->join('roles', function ($j) {
                $j->on('roles.id', '=', 'club_member_roles.role_id')
                    ->where('roles.is_active', 1)
                    ->whereNull('roles.deleted_at');
            })
            ->join('role_permissions', function ($j) {
                $j->on('role_permissions.role_id', '=', 'roles.id')
                    ->where('role_permissions.is_active', 1)
                    ->whereNull('role_permissions.deleted_at');
            })
            ->join('permissions', function ($j) {
                $j->on('permissions.id', '=', 'role_permissions.permission_id')
                    ->where('permissions.is_active', 1)
                    ->whereNull('permissions.deleted_at');
            })
            ->join('modules', function ($j) {
                $j->on('modules.id', '=', 'permissions.module_id')
                    ->where('modules.is_active', 1)
                    ->whereNull('modules.deleted_at');
            })
            ->where('club_member_roles.user_id', $this->id)
            ->where('club_member_roles.is_active', 1)
            ->whereNull('club_member_roles.deleted_at')
            ->select(
                'club_member_roles.club_id',
                'modules.slug as module',
                'permissions.action'
            )
            ->get();

        // Build plain PHP array (KHÔNG dùng Collection::toArray() — nó reindex
        // numeric string keys thành 0,1 → JSON ra array tuần tự, mất key).
        //
        // System scope (club_id NULL)  → top-level module key:   { module: [actions] }
        // Club scope (club_id = id)    → nested club_{id} key:   { "club_{id}": { module: [actions] } }
        $result = [];
        foreach ($rows as $r) {
            if ($r->club_id === null) {
                // System scope — flat ở top-level (key = module slug).
                if (!isset($result[$r->module])) {
                    $result[$r->module] = [];
                }
                if (!in_array($r->action, $result[$r->module], true)) {
                    $result[$r->module][] = $r->action;
                }
            } else {
                // Club scope — nested dưới "club_{id}".
                $key = 'club_' . $r->club_id;
                if (!isset($result[$key])) {
                    $result[$key] = [];
                }
                if (!isset($result[$key][$r->module])) {
                    $result[$key][$r->module] = [];
                }
                if (!in_array($r->action, $result[$key][$r->module], true)) {
                    $result[$key][$r->module][] = $r->action;
                }
            }
        }

        return $result;
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

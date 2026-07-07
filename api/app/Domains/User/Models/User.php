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
     * Auto pass tất cả permission.
     */
    public function isSuperAdmin(): bool
    {
        return DB::table('club_member_roles')
            ->join('roles', 'roles.id', '=', 'club_member_roles.role_id')
            ->where('club_member_roles.user_id', $this->id)
            ->where('club_member_roles.is_active', 1)
            ->where('roles.slug', 'superadmin')
            ->whereNull('roles.club_id')
            ->where('roles.is_active', 1)
            ->exists();
    }
    /**
     * Kiểm tra quyền theo module + action.
     *
     * @param string   $module   slug của module (vd: 'club', 'fund')
     * @param string   $action   action (vd: 'view', 'create', 'update', 'delete')
     * @param int|null $clubId   null = kiểm tra trong bất kỳ club nào user thuộc về
     */
    public function hasPermission(string $module, string $action, ?int $clubId = null): bool
    {
        // Superadmin [*] bypass tất cả
        if ($this->isSuperAdmin()) {
            return true;
        }
        $query = DB::table('club_member_roles')
            ->join('roles', 'roles.id', '=', 'club_member_roles.role_id')
            ->join('role_permissions', 'role_permissions.role_id', '=', 'roles.id')
            ->join('permissions', 'permissions.id', '=', 'role_permissions.permission_id')
            ->join('modules', 'modules.id', '=', 'permissions.module_id')
            ->where('club_member_roles.user_id', $this->id)
            ->where('club_member_roles.is_active', 1)
            ->where('roles.is_active', 1)
            ->where('role_permissions.is_active', 1)
            ->where('permissions.is_active', 1)
            ->where('modules.slug', $module)
            ->where('permissions.action', $action);
        if ($clubId !== null) {
            $query->where('club_member_roles.club_id', $clubId);
        }
        return $query->exists();
    }

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
        // group: { club_id: { module: [actions] } }
        return $rows
            ->groupBy('club_id')
            ->map(
                fn($byClub) =>
                $byClub->groupBy('module')
                    ->map(
                        fn($byModule) =>
                        $byModule->pluck('action')->unique()->values()
                    )
            )
            ->toArray();
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

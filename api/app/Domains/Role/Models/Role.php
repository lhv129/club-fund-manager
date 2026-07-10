<?php
namespace App\Domains\Role\Models;
use App\Domains\Club\Models\Club;
use App\Domains\Club\Models\ClubMemberRole;
use App\Domains\Permission\Models\Permission;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Role extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = [
        'slug',
        'sort_order',
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
    public function translations()
    {
        return $this->hasMany(RoleTranslation::class);
    }
    public function translation(string $locale = null)
    {
        return $this->hasOne(RoleTranslation::class)
            ->where('locale', $locale ?? app()->getLocale());
    }
    public function permissions()
    {
        return $this->belongsToMany(Permission::class, 'role_permissions')
            ->wherePivot('is_active', 1)
            ->whereNull('role_permissions.deleted_at')
            ->withPivot(['is_active'])
            ->withTimestamps();
    }
    public function memberRoles()
    {
        return $this->hasMany(ClubMemberRole::class);
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
    public function scopeSystem($query)
    {
        return $query->whereNull('club_id');
    }
    public function scopeForClub($query, int $clubId)
    {
        return $query->where('club_id', $clubId);
    }
}
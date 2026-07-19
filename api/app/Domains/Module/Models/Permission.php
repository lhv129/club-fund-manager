<?php

namespace App\Domains\Module\Models;

use App\Domains\Module\Models\Module;
use App\Domains\Role\Models\Role;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Permission extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = [
        'module_id',
        'action',      // 'view' | 'create' | 'update' | 'delete'
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
    public function module()
    {
        return $this->belongsTo(Module::class);
    }
    public function translations()
    {
        return $this->hasMany(PermissionTranslation::class);
    }
    public function translation(string $locale = null)
    {
        return $this->hasOne(PermissionTranslation::class)
            ->where('locale', $locale ?? app()->getLocale());
    }
    public function roles()
    {
        return $this->belongsToMany(Role::class, 'role_permissions')
            ->wherePivot('is_active', 1)
            ->whereNull('role_permissions.deleted_at')
            ->withPivot(['is_active'])
            ->withTimestamps();
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
    public function scopeAction($query, string $action)
    {
        return $query->where('action', $action);
    }
}

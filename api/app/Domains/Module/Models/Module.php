<?php

namespace App\Domains\Module\Models;

use App\Domains\Permission\Models\Permission;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Module extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = [
        'slug',        // 'club' | 'member' | 'fund' | 'transaction' | ...
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
    public function translations()
    {
        return $this->hasMany(ModuleTranslation::class);
    }
    public function translation(string $locale = null)
    {
        return $this->hasOne(ModuleTranslation::class)
            ->where('locale', $locale ?? app()->getLocale());
    }
    public function permissions()
    {
        return $this->hasMany(Permission::class);
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
}

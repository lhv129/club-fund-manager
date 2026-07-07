<?php

namespace App\Domains\Club\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Club extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = ['slug', 'logo', 'sort_order', 'is_active'];

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
        return $this->hasMany(ClubTranslation::class);
    }

    public function translation(string $locale = null)
    {
        $locale = $locale ?? app()->getLocale();
        return $this->hasOne(ClubTranslation::class)->where('locale', $locale);
    }

    public function members()
    {
        return $this->hasMany(ClubMember::class);
    }

    public function memberRoles()
    {
        return $this->hasMany(ClubMemberRole::class);
    }
}

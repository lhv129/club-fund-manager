<?php

namespace App\Domains\Role\Models;

use App\Domains\Module\Models\Permission;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RolePermission extends Model
{
    use HasFactory;

    protected $table = 'role_permissions';

    protected $fillable = [
        'role_id',
        'permission_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public $timestamps = false; // pivot thường không cần timestamps

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function permission()
    {
        return $this->belongsTo(Permission::class);
    }
}
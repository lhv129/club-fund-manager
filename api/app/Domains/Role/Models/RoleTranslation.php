<?php
namespace App\Domains\Role\Models;
use Illuminate\Database\Eloquent\Model;
class RoleTranslation extends Model
{
    protected $fillable = [
        'role_id',
        'locale',
        'name',
        'description',
    ];
    public $timestamps = false;
    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}
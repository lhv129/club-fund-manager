<?php
namespace App\Domains\Role\Models;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class RoleTranslation extends Model
{
    use HasFactory, SoftDeletes;
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
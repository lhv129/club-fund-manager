<?php
namespace App\Domains\Module\Models;
use App\Domains\Module\Models\Permission;
use Illuminate\Database\Eloquent\Model;

class PermissionTranslation extends Model
{
    protected $fillable = [
        'permission_id',
        'locale',
        'name',        // vd: "Xem danh sách", "Tạo mới", ...
        'description',
    ];
    public $timestamps = false;
    public function permission()
    {
        return $this->belongsTo(Permission::class);
    }
}


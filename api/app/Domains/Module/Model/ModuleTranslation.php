<?php

namespace App\Domains\Module\Models;

use Illuminate\Database\Eloquent\Model;

class ModuleTranslation extends Model
{
    protected $fillable = [
        'module_id',
        'locale',
        'name',        // vd: "Câu lạc bộ", "Thành viên", "Quỹ", ...
        'description',
    ];
    public $timestamps = false;
    public function module()
    {
        return $this->belongsTo(Module::class);
    }
}

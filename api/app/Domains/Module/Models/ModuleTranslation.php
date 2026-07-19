<?php

namespace App\Domains\Module\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ModuleTranslation extends Model
{
    use HasFactory, SoftDeletes;

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

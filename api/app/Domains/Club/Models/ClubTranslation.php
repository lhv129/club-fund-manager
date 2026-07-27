<?php
// App\Domains\Club\Models

namespace App\Domains\Club\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubTranslation extends Model
{
    use HasFactory, SoftDeletes;    

    protected $fillable = [
        'club_id',
        'locale',
        'name',
        'slug',
        'description',
    ];

    public $timestamps = false;

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function club()
    {
        return $this->belongsTo(Club::class);
    }
}
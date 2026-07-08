<?php
// App\Domains\Club\Models

namespace App\Domains\Club\Models;

use Illuminate\Database\Eloquent\Model;

class ClubTranslation extends Model
{
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
<?php

namespace App\Domains\PlayingSchedule\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlayingScheduleTranslation extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'playing_schedule_translations';

    protected $fillable = [
        'playing_schedule_id',
        'locale',
        'title',
        'note',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function playingSchedule(): BelongsTo
    {
        return $this->belongsTo(PlayingSchedule::class);
    }
}

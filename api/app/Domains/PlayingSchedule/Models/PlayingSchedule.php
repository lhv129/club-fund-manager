<?php

namespace App\Domains\PlayingSchedule\Models;

use App\Domains\Club\Models\Club;
use App\Domains\ExchangeSession\Models\ExchangeSession;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class PlayingSchedule extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'playing_schedules';

    protected $fillable = [
        'club_id',

        'weekday',
        'court_name',
        'court_address',
        'start_time',
        'end_time',

        'auto_generate',
        'weeks_ahead',
        'start_date',
        'end_date',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'weekday'        => 'integer',
            'start_time'     => 'datetime',
            'end_time'       => 'datetime',
            'auto_generate'  => 'boolean',
            'weeks_ahead'    => 'integer',
            'start_date'     => 'date',
            'end_date'       => 'date',
            'sort_order'     => 'integer',
            'is_active'      => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function club(): BelongsTo
    {
        return $this->belongsTo(Club::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(PlayingScheduleTranslation::class);
    }

    public function translation(string $locale = null): HasOne
    {
        return $this->hasOne(PlayingScheduleTranslation::class)
            ->where('locale', $locale ?? app()->getLocale());
    }

    public function exchangeSessions(): HasMany
    {
        return $this->hasMany(ExchangeSession::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeAutoGenerate(Builder $query): Builder
    {
        return $query->where('auto_generate', true);
    }
}

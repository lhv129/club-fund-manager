<?php

namespace App\Domains\ExchangeSession\Models;

use App\Domains\Club\Models\Club;
use App\Domains\PlayingSchedule\Models\PlayingSchedule;
use App\Domains\Transaction\Models\Transaction;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExchangeSession extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'exchange_sessions';

    protected $fillable = [
        'club_id',
        'playing_schedule_id',   // nullable — null khi tạo thủ công
        'transaction_id',        // nullable

        'session_date',
        'court_name',
        'court_address',
        'start_time',
        'end_time',

        'type',                   // scheduled | manual
        'status',                 // upcoming | completed | cancelled

        'player_count',
        'amount_per_player',
        'total_amount',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'session_date'       => 'date',
            'start_time'         => 'datetime',
            'end_time'           => 'datetime',
            'player_count'       => 'integer',
            'amount_per_player'  => 'decimal:2',
            'total_amount'       => 'decimal:2',
            'sort_order'         => 'integer',
            'is_active'          => 'boolean',
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

    public function playingSchedule(): BelongsTo
    {
        return $this->belongsTo(PlayingSchedule::class);
    }

    public function transaction(): BelongsTo
    {
        return $this->belongsTo(Transaction::class);
    }

    public function translations(): HasMany
    {
        return $this->hasMany(ExchangeSessionTranslation::class);
    }

    public function translation(string $locale = null): HasOne
    {
        return $this->hasOne(ExchangeSessionTranslation::class)
            ->where('locale', $locale ?? app()->getLocale());
    }

    public function players(): HasMany
    {
        return $this->hasMany(ExchangeSessionPlayer::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where('status', 'upcoming');
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->where('status', 'completed');
    }

    public function scopeCancelled(Builder $query): Builder
    {
        return $query->where('status', 'cancelled');
    }

    public function scopeScheduled(Builder $query): Builder
    {
        return $query->where('type', 'scheduled');
    }

    public function scopeManual(Builder $query): Builder
    {
        return $query->where('type', 'manual');
    }
}

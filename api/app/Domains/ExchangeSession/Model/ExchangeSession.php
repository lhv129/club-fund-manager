<?php

namespace App\Domains\ExchangeSession\Models;

use App\Domains\Club\Models\Club;
use App\Domains\ExchangeSession\Models\ExchangeSessionPlayer;
use App\Domains\ExchangeSession\Models\ExchangeSessionTranslation;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExchangeSession extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'created_by',
        'session_date',
        'start_time',
        'end_time',
        'location',
        'cost',              // tổng chi phí buổi đánh
        'max_players',       // nullable — không giới hạn nếu null
        'status',            // 'open' | 'closed' | 'cancelled'
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'session_date' => 'date',
            'start_time'   => 'datetime',
            'end_time'     => 'datetime',
            'cost'         => 'decimal:2',
            'is_active'    => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function club()
    {
        return $this->belongsTo(Club::class);
    }

    public function createdBy()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function translations()
    {
        return $this->hasMany(ExchangeSessionTranslation::class);
    }

    public function translation(string $locale = null)
    {
        return $this->hasOne(ExchangeSessionTranslation::class)
            ->where('locale', $locale ?? app()->getLocale());
    }

    public function players()
    {
        return $this->hasMany(ExchangeSessionPlayer::class);
    }

    public function attendedPlayers()
    {
        return $this->hasMany(ExchangeSessionPlayer::class)
            ->where('status', 'attended');
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeOpen($query)
    {
        return $query->where('status', 'open');
    }

    public function scopeUpcoming($query)
    {
        return $query->where('session_date', '>=', now()->toDateString())
            ->where('status', 'open');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */
    public function isFull(): bool
    {
        if ($this->max_players === null) {
            return false;
        }

        return $this->players()
            ->where('status', '!=', 'absent')
            ->where('is_active', 1)
            ->count() >= $this->max_players;
    }

    /**
     * Chi phí mỗi người tham gia (chia đều cho attended).
     */
    public function costPerPlayer(): float
    {
        $count = $this->attendedPlayers()->where('is_active', 1)->count();

        return $count > 0 ? round($this->cost / $count, 2) : 0;
    }
}

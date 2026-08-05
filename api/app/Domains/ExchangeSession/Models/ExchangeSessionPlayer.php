<?php

namespace App\Domains\ExchangeSession\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExchangeSessionPlayer extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'exchange_session_players';

    protected $fillable = [
        'exchange_session_id',
        'user_id',          // nullable — null khi khách ngoài
        'player_name',

        'amount',
        'paid',
        'checked_in',

        'sort_order',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'amount'     => 'decimal:2',
            'paid'       => 'boolean',
            'checked_in' => 'boolean',
            'sort_order' => 'integer',
            'is_active'  => 'boolean',
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function exchangeSession(): BelongsTo
    {
        return $this->belongsTo(ExchangeSession::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */

    public function scopePaid(Builder $query): Builder
    {
        return $query->where('paid', true);
    }

    public function scopeUnpaid(Builder $query): Builder
    {
        return $query->where('paid', false);
    }

    public function scopeCheckedIn(Builder $query): Builder
    {
        return $query->where('checked_in', true);
    }
}

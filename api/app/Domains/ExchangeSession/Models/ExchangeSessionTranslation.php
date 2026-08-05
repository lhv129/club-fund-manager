<?php

namespace App\Domains\ExchangeSession\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class ExchangeSessionTranslation extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'exchange_session_translations';

    protected $fillable = [
        'exchange_session_id',
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

    public function exchangeSession(): BelongsTo
    {
        return $this->belongsTo(ExchangeSession::class);
    }
}

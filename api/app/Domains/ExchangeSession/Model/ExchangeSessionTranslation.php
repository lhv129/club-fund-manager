<?php

namespace App\Domains\ExchangeSession\Models;

use App\Domains\ExchangeSession\Models\ExchangeSession;
use Illuminate\Database\Eloquent\Model;

class ExchangeSessionTranslation extends Model
{
    protected $fillable = [
        'exchange_session_id',
        'locale',
        'name',
        'note',
    ];

    public $timestamps = false;

    public function exchangeSession()
    {
        return $this->belongsTo(ExchangeSession::class);
    }
}

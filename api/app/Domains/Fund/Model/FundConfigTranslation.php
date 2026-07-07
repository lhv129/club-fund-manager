<?php

namespace App\Domains\Fund\Models;

use Illuminate\Database\Eloquent\Model;

class FundConfigTranslation extends Model
{
    protected $fillable = [
        'fund_config_id',
        'locale',
        'name',
        'description',
    ];

    public $timestamps = false;

    public function fundConfig()
    {
        return $this->belongsTo(FundConfig::class);
    }
}

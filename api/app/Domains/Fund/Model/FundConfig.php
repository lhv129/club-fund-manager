<?php

namespace App\Domains\Fund\Models;

use App\Domains\Club\Models\Club;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class FundConfig extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'club_id',
        'monthly_amount',     // số tiền đóng quỹ mặc định mỗi tháng
        'penalty_amount',     // phí phạt khi vắng không phép
        'collect_day',        // ngày thu quỹ trong tháng (1-28)
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'monthly_amount' => 'decimal:2',
            'penalty_amount' => 'decimal:2',
            'collect_day'    => 'integer',
            'is_active'      => 'boolean',
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

    public function translations()
    {
        return $this->hasMany(FundConfigTranslation::class);
    }

    public function translation(string $locale = null)
    {
        return $this->hasOne(FundConfigTranslation::class)
            ->where('locale', $locale ?? app()->getLocale());
    }

    /*
    |--------------------------------------------------------------------------
    | Scopes
    |--------------------------------------------------------------------------
    */
    public function scopeActive($query)
    {
        return $query->where('is_active', 1);
    }
}

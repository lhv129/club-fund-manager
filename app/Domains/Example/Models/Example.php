<?php

namespace App\Domains\Example\Models;

use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;

class Example extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'examples';

    protected $fillable = [
        'user_id',
        'title',
        'slug',
        'description',
        'is_active',
        'sort_order',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'sort_order' => 'integer',
    ];

    // -------------------------------------------------------------------------
    // Scopes — dùng trong BaseRepository::getActive()
    // -------------------------------------------------------------------------

    /**
     * scopeActive — BaseRepository::getActive() tự gọi nếu method này tồn tại
     * Nếu KHÔNG có scope này, Base fallback về where('is_active', true)
     */
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeInactive($query)
    {
        return $query->where('is_active', false);
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    /**
     * Quan hệ với User (người tạo)
     * Dùng: $example->user->name
     * Eager load: ->with('user')
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // -------------------------------------------------------------------------
    // Accessors / Mutators
    // -------------------------------------------------------------------------

    /**
     * Tự sinh slug từ title nếu không truyền slug
     */
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->slug)) {
                $model->slug = Str::slug($model->title);
            }
        });
    }
}

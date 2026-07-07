<?php
namespace App\Domains\Club\Models;
use App\Domains\Role\Models\Role;
use App\Domains\User\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ClubMemberRole extends Model
{
    use HasFactory, SoftDeletes;
    protected $fillable = [
        'club_id',
        'user_id',
        'role_id',
        'is_active',
    ];
    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
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
    public function user()
    {
        return $this->belongsTo(User::class);
    }
    public function role()
    {
        return $this->belongsTo(Role::class);
    }
}


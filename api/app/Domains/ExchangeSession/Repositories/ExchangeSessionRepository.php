<?php

namespace App\Domains\ExchangeSession\Repositories;

use App\Base\BaseRepository;
use App\Domains\ExchangeSession\Models\ExchangeSession;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;

class ExchangeSessionRepository extends BaseRepository
{
    /** ExchangeSession mặc định sort theo session_date desc (buổi gần nhất trước) */
    protected string $defaultOrderBy = 'session_date';

    protected string $defaultOrderDirection = 'desc';

    protected array $allowedSortColumns = ['id', 'session_date', 'status', 'type', 'sort_order', 'created_at'];

    protected array $selectColumns = ['id', 'club_id', 'session_date', 'status', 'is_active'];

    protected array $selectWith = ['playingSchedule.translations:id,playing_schedule_id,locale,title'];

    public function __construct(ExchangeSession $model)
    {
        parent::__construct($model);
    }

    protected function baseListQuery(): Builder
    {
        return $this->model
            ->select([
                'id',
                'club_id',
                'playing_schedule_id',
                'transaction_id',
                'session_date',
                'court_name',
                'court_address',
                'start_time',
                'end_time',
                'type',
                'status',
                'player_count',
                'amount_per_player',
                'total_amount',
                'exchange_male_amount',
                'exchange_female_amount',
                'is_active',
                'sort_order',
                'created_at',
            ])
            ->with(['playingSchedule:id', 'playingSchedule.translations:id,playing_schedule_id,locale,title']);
    }

    protected function applySearch(Builder $query, array $filters): void
    {
        if (! empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->whereHas('playingSchedule.translations', function ($t) use ($search) {
                    $t->where('title', 'like', "%{$search}%");
                })
                    ->orWhere('court_name', 'like', "%{$search}%")
                    ->orWhere('court_address', 'like', "%{$search}%");
            });
        }
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyActiveFilter($query, $filters);

        if (! empty($filters['club_id'])) {
            $query->where('club_id', (int) $filters['club_id']);
        }

        if (! empty($filters['playing_schedule_id'])) {
            $query->where('playing_schedule_id', (int) $filters['playing_schedule_id']);
        }

        $this->applyStatusFilter($query, $filters, 'status', ['upcoming', 'completed', 'cancelled']);
        $this->applyStatusFilter($query, $filters, 'type', ['scheduled', 'manual']);
        $this->applyDateFilter($query, $filters, 'session_date');
    }

    /**
     * Kiểm tra đã có session cho (schedule_id, session_date) chưa.
     * withTrashed() để tránh tạo lại bản ghi đã soft-delete.
     */
    public function existsForScheduleAndDate(int $scheduleId, string $date): bool
    {
        return $this->model
            // ->withTrashed()
            ->where('playing_schedule_id', $scheduleId)
            ->whereDate('session_date', $date)
            ->exists();
    }

    public function findForScheduleAndDate(int $scheduleId, string $date): ?ExchangeSession
    {
        return $this->model
            ->where('playing_schedule_id', $scheduleId)
            ->whereDate('session_date', $date)
            ->first();
    }

    /**
     * Lấy các session upcoming + scheduled của 1 schedule — dùng cho cascade sync
     * khi admin sửa PlayingSchedule (giờ/sân). Không đè session completed/cancelled.
     */
    public function getUpcomingScheduledForSchedule(int $scheduleId): Collection
    {
        return $this->model
            ->where('playing_schedule_id', $scheduleId)
            ->where('type', 'scheduled')
            ->where('status', 'upcoming')
            ->get();
    }

    /**
     * Các buổi vẫn upcoming nhưng thời gian kết thúc đã qua.
     */
    public function getExpiredUpcoming(?int $scheduleId = null): Collection
    {
        $now = now();

        return $this->model
            ->where('status', 'upcoming')
            ->where('is_active', true)
            ->where(function (Builder $query) use ($now) {
                $query->whereDate('session_date', '<', $now->toDateString())
                    ->orWhere(function (Builder $sameDay) use ($now) {
                        $sameDay->whereDate('session_date', $now->toDateString())
                            ->whereTime('end_time', '<', $now->format('H:i:s'));
                    });
            })
            ->when($scheduleId, fn (Builder $query) => $query->where('playing_schedule_id', $scheduleId))
            ->orderBy('session_date')
            ->orderBy('end_time')
            ->get();
    }
}

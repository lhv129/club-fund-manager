<?php

namespace App\Domains\Notification\Repositories;

use App\Base\BaseRepository;
use App\Domains\Notification\Models\Notification;
use Illuminate\Database\Eloquent\Builder;

class NotificationRepository extends BaseRepository
{
    protected string $defaultOrderBy = 'created_at';

    protected string $defaultOrderDirection = 'desc';

    protected array $allowedSortColumns = ['id', 'created_at', 'read_at'];

    public function __construct(Notification $model)
    {
        parent::__construct($model);
    }

    protected function baseListQuery(): Builder
    {
        return $this->model->newQuery()->with(['club.translation']);
    }

    protected function applyFilters(Builder $query, array $filters): void
    {
        $query->where('user_id', (int) $filters['user_id']);

        if (array_key_exists('is_read', $filters) && $filters['is_read'] !== '') {
            $filters['is_read']
                ? $query->whereNotNull('read_at')
                : $query->whereNull('read_at');
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (! empty($filters['club_id'])) {
            $query->where('club_id', (int) $filters['club_id']);
        }
    }

    public function unreadCount(int $userId): int
    {
        return $this->model->newQuery()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->count();
    }

    public function markRead(Notification $notification): void
    {
        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }
    }

    public function markAllRead(int $userId): int
    {
        return $this->model->newQuery()
            ->where('user_id', $userId)
            ->whereNull('read_at')
            ->update(['read_at' => now(), 'updated_at' => now()]);
    }

    public function findOwned(int $id, int $userId): ?Notification
    {
        return $this->model->newQuery()
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first();
    }
}

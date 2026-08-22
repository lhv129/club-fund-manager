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

    public function markRead(Notification $notification): Notification
    {
        if ($notification->read_at === null) {
            $notification->update(['read_at' => now()]);
        }

        return $notification->refresh()->load('club.translation');
    }

    public function markAllRead(array $data): array
    {
        $userId = (int) $data['user_id'];
        $now = now();

        $query = $this->model->newQuery()
            ->where('user_id', $userId)
            ->whereNull('read_at');

        if (! empty($data['ids'])) {
            $query->whereIn('id', $data['ids']);
        }

        $query->update([
            'read_at' => $now,
            'updated_at' => $now,
        ]);

        return [
            'ids' => ! empty($data['ids']) ? array_values($data['ids']) : null,
            'all' => empty($data['ids']),
            'read_at' => $now->toISOString(),
            'unread_count' => $this->unreadCount($userId),
        ];
    }

    public function findOwned(int $id, int $userId): ?Notification
    {
        return $this->model->newQuery()
            ->where('id', $id)
            ->where('user_id', $userId)
            ->first();
    }

    public function deleteOwned(Notification $notification): int
    {
        $userId = (int) $notification->user_id;
        $notification->delete();

        return $this->unreadCount($userId);
    }
}

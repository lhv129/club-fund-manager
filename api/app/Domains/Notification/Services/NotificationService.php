<?php

namespace App\Domains\Notification\Services;

use App\Base\BaseService;
use App\Domains\Notification\Events\NotificationCreated;
use App\Domains\Notification\Models\Notification;
use App\Domains\Notification\Repositories\NotificationRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class NotificationService extends BaseService
{
    protected object $repository;

    public function __construct(NotificationRepository $repository)
    {
        parent::__construct($repository);
        $this->repository = $repository;
    }

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    public function unreadCount(int $userId): int
    {
        return $this->repository->unreadCount($userId);
    }

    public function markRead(int $id, int $userId): void
    {
        $notification = $this->repository->findOwned($id, $userId);

        if (! $notification) {
            throw new ApiException(__('domains/notification.not_found'), 404);
        }

        $this->repository->markRead($notification);
    }

    public function markAllRead(int $userId): int
    {
        return $this->repository->markAllRead($userId);
    }

    public function deleteOwned(int $id, int $userId): void
    {
        $notification = $this->repository->findOwned($id, $userId);

        if (! $notification) {
            throw new ApiException(__('domains/notification.not_found'), 404);
        }

        $this->repository->delete($notification);
    }

    public function send(int $userId, string $type, array $data = [], ?int $clubId = null): Notification
    {
        /** @var Notification $notification */
        $notification = $this->repository->create([
            'club_id' => $clubId,
            'user_id' => $userId,
            'type' => $type,
            'data' => $data,
            'read_at' => null,
        ]);

        NotificationCreated::dispatch($notification);

        return $notification;
    }
}

<?php

namespace App\Domains\Notification\Controllers;

use App\Base\BaseController;
use App\Domains\Notification\Requests\FilterNotificationRequest;
use App\Domains\Notification\Resources\NotificationResource;
use App\Domains\Notification\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;

class NotificationController extends BaseController
{
    public function __construct(protected NotificationService $service) {}

    public function index(FilterNotificationRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $filters['user_id'] = Auth::id();

        return $this->paginateResponse(
            $this->service->paginate($filters),
            __('domains/notification.list'),
            NotificationResource::class,
        );
    }

    public function unreadCount(): JsonResponse
    {
        return $this->responseCommon(true, __('domains/notification.unread_count'), [
            'count' => $this->service->unreadCount((int) Auth::id()),
        ]);
    }

    public function markRead(int $id): JsonResponse
    {
        $this->service->markRead($id, (int) Auth::id());

        return $this->responseCommon(true, __('domains/notification.marked_read'));
    }

    public function markAllRead(): JsonResponse
    {
        $count = $this->service->markAllRead((int) Auth::id());

        return $this->responseCommon(true, __('domains/notification.marked_all_read'), ['count' => $count]);
    }

    public function destroy(int $id): JsonResponse
    {
        $this->service->deleteOwned($id, (int) Auth::id());

        return $this->responseCommon(true, __('domains/notification.deleted'));
    }
}

<?php

namespace App\Domains\Notification\Controllers;

use App\Base\BaseController;
use App\Domains\Notification\Requests\FilterNotificationRequest;
use App\Domains\Notification\Requests\MarkAllReadRequest;
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

        $paginator = $this->service->paginate($filters);
        $response = $this->paginateResponse($paginator, __('domains/notification.list'), NotificationResource::class);
        $payload = $response->getData(true);
        $payload['meta']['unread_count'] = $this->service->unreadCount((int) Auth::id());

        return response()->json($payload);
    }

    public function unreadCount(): JsonResponse
    {
        return $this->responseCommon(true, __('domains/notification.unread_count'), [
            'count' => $this->service->unreadCount((int) Auth::id()),
        ]);
    }

    public function markRead(int $id): JsonResponse
    {
        $result = $this->service->markRead($id, (int) Auth::id());

        return $this->responseCommon(true, __('domains/notification.marked_read'), [
            'notification' => (new NotificationResource($result['notification']))->resolve(),
            'unread_count' => $result['unread_count'],
        ]);
    }

    public function markAllRead(MarkAllReadRequest $request): JsonResponse
    {
        $data = $request->validated();

        $data['user_id'] = (int) Auth::id();

        $result = $this->service->markAllRead($data);

        return $this->responseCommon(
            true,
            __('domains/notification.marked_all_read'),
            $result
        );
    }

    public function destroy(int $id): JsonResponse
    {
        $result = $this->service->deleteOwned($id, (int) Auth::id());

        return $this->responseCommon(true, __('domains/notification.deleted'), $result);
    }
}

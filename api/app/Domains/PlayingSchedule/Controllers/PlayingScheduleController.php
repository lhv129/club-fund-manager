<?php

namespace App\Domains\PlayingSchedule\Controllers;

use App\Base\BaseController;
use App\Domains\PlayingSchedule\Requests\FilterPlayingScheduleRequest;
use App\Domains\PlayingSchedule\Requests\ReorderPlayingScheduleRequest;
use App\Domains\PlayingSchedule\Requests\StorePlayingScheduleRequest;
use App\Domains\PlayingSchedule\Requests\UpdatePlayingScheduleRequest;
use App\Domains\PlayingSchedule\Resources\PlayingScheduleResource;
use App\Domains\PlayingSchedule\Services\PlayingScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PlayingScheduleController extends BaseController
{
    public function __construct(protected PlayingScheduleService $service) {}

    /**
     * GET /api/v1/playing-schedules?search=abc&club_id=1&weekday=2&is_active=1&sort_by=sort_order&sort_dir=asc&limit=20&page=1
     */
    public function index(FilterPlayingScheduleRequest $request): JsonResponse
    {
        return $this->paginateResponse(
            $this->service->paginate($request->validated()),
            __('domains/playing_schedule.list'),
            PlayingScheduleResource::class,
        );
    }

    /**
     * GET /api/v1/playing-schedules/cursor?limit=10&cursor=eyJpZCI6MTAwfQ
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        return $this->cursorResponse(
            $this->service->cursorPaginate($request->only(['limit', 'search', 'club_id', 'weekday', 'is_active'])),
            __('domains/playing_schedule.list'),
            PlayingScheduleResource::class,
        );
    }

    /**
     * GET /api/v1/playing-schedules/select — dropdown, không Resource, không phân trang.
     */
    public function select(Request $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/playing_schedule.select'),
            $this->service->getForSelect($request->only(['search', 'club_id', 'weekday', 'is_active', 'limit'])),
        );
    }

    /**
     * GET /api/v1/playing-schedules/{id}
     */
    public function show(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/playing_schedule.detail'),
            new PlayingScheduleResource($this->service->findWithRelations($id, ['translations', 'club'])),
        );
    }

    /**
     * POST /api/v1/playing-schedules
     */
    public function store(StorePlayingScheduleRequest $request): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/playing_schedule.created'),
            new PlayingScheduleResource($this->service->create($request->validated())),
            201,
        );
    }

    /**
     * PUT /api/v1/playing-schedules/{id}
     */
    public function update(UpdatePlayingScheduleRequest $request, int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/playing_schedule.updated'),
            new PlayingScheduleResource($this->service->update($id, $request->validated())),
        );
    }

    /**
     * DELETE /api/v1/playing-schedules/{id} — xoá mềm + dồn sort_order.
     */
    public function destroy(int $id): JsonResponse
    {
        $this->service->deleteWithSortOrder($id);

        return $this->responseCommon(true, __('domains/playing_schedule.deleted'));
    }

    /**
     * PATCH /api/v1/playing-schedules/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        return $this->responseCommon(
            true,
            __('domains/playing_schedule.status_toggled'),
            new PlayingScheduleResource($this->service->toggleStatus($id)),
        );
    }

    /**
     * POST /api/v1/playing-schedules/reorder — kéo thả sort_order.
     */
    public function reorder(ReorderPlayingScheduleRequest $request): JsonResponse
    {
        $this->service->reorder($request->validated());

        return $this->responseCommon(true, __('domains/playing_schedule.reordered'));
    }
}

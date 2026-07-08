<?php

namespace App\Domains\Club\Controllers;

use App\Base\BaseController;
use App\Domains\Club\Requests\FilterClubRequest;
use App\Domains\Club\Requests\StoreClubRequest;
use App\Domains\Club\Requests\UpdateClubRequest;
use App\Domains\Club\Resources\ClubResource;
use App\Domains\Club\Services\ClubService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClubController extends BaseController
{
    public function __construct(
        protected ClubService $clubService
    ) {}

    /**
     * GET /api/v1/clubs
     * Superadmin -> tất cả clubs
     * Manager/Member -> chỉ clubs mình được approved
     */
    public function index(FilterClubRequest $request): JsonResponse
    {
        $clubs = $this->clubService->index(
            $request->user(),
            $request->validated()
        );

        return $this->paginateResponse($clubs, __('domains/club.list'));
    }

    /**
     * GET /api/v1/clubs/cursor?limit=10&cursor=xxx
     *
     * Lần đầu: không cần cursor
     * Lần sau: truyền cursor từ meta.next_cursor của response trước
     */
    public function cursorIndex(Request $request): JsonResponse
    {
        $params    = $request->only(['limit', 'search', 'is_active']);
        $paginator = $this->clubService->cursorPaginate($params);

        return $this->cursorResponse($paginator, __('domains/club.list'));
    }

    /**
     * GET /api/v1/clubs/select
     */
    public function select(Request $request): JsonResponse
    {
        $params = $request->only(['search', 'is_active', 'limit']);
        $data   = $this->clubService->getForSelect($params);

        return $this->responseCommon(true, __('domains/club.select'), $data);
    }

    /**
     * GET /api/v1/clubs/{id}
     */
    public function show(int $id): JsonResponse
    {
        $club = $this->clubService->find($id);

        return $this->responseCommon(true, __('domains/club.detail'), new ClubResource($club));
    }

    /**
     * GET /api/v1/clubs/slug/{slug}
     */
    public function showBySlug(string $slug): JsonResponse
    {
        $club = $this->clubService->findBySlug($slug);

        return $this->responseCommon(true, __('domains/club.detail'), new ClubResource($club));
    }

    /**
     * POST /api/v1/clubs
     */
    public function store(StoreClubRequest $request): JsonResponse
    {
        $club = $this->clubService->create($request->validated());

        return $this->responseCommon(true, __('domains/club.created'), new ClubResource($club), 201);
    }

    /**
     * PUT /api/v1/clubs/{id}
     */
    public function update(UpdateClubRequest $request, int $id): JsonResponse
    {
        $club = $this->clubService->update($id, $request->validated());

        return $this->responseCommon(true, __('domains/club.updated'), new ClubResource($club));
    }

    /**
     * DELETE /api/v1/clubs/{id}
     */
    public function destroy(int $id): JsonResponse
    {
        $this->clubService->delete($id);

        return $this->responseCommon(true, __('domains/club.deleted'));
    }

    /**
     * PATCH /api/v1/clubs/{id}/toggle-status
     */
    public function toggleStatus(int $id): JsonResponse
    {
        $club = $this->clubService->toggleStatus($id);

        return $this->responseCommon(true, __('domains/club.status_toggled'), new ClubResource($club));
    }
}

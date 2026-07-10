<?php

namespace App\Domains\Club\Controllers;

use App\Base\BaseController;
use App\Domains\Club\Requests\FilterClubInviteRequest;
use App\Domains\Club\Requests\StoreClubInviteRequest;
use App\Domains\Club\Resources\ClubInviteResource;
use App\Domains\Club\Services\ClubInviteService;
use Illuminate\Http\JsonResponse;

class ClubInviteController extends BaseController
{
    public function __construct(
        protected ClubInviteService $inviteService
    ) {}

    /**
     * GET /api/v1/clubs/{clubId}/invites
     * Danh sách link invite của club
     */
    public function index(FilterClubInviteRequest $request, int $clubId): JsonResponse
    {
        $invites = $this->inviteService->paginateClubInvites($clubId, $request->validated());

        return $this->paginateResponse($invites, __('domains/club_invite.list'));
    }

    /**
     * GET /api/v1/clubs/{clubId}/invites/{id}
     */
    public function show(int $clubId, int $id): JsonResponse
    {
        $invite = $this->inviteService->findClubInvite($clubId, $id);

        return $this->responseCommon(true, __('domains/club_invite.detail'), new ClubInviteResource($invite));
    }

    /**
     * POST /api/v1/clubs/{clubId}/invites
     * Tạo link invite mới cho club
     */
    public function store(StoreClubInviteRequest $request, int $clubId): JsonResponse
    {
        $invite = $this->inviteService->createClubInvite($clubId, $request->validated());

        return $this->responseCommon(true, __('domains/club_invite.created'), new ClubInviteResource($invite), 201);
    }

    /**
     * DELETE /api/v1/clubs/{clubId}/invites/{id}
     * Thu hồi link invite
     */
    public function destroy(int $clubId, int $id): JsonResponse
    {
        $this->inviteService->deleteClubInvite($clubId, $id);

        return $this->responseCommon(true, __('domains/club_invite.deleted'));
    }

    /**
     * POST /api/v1/clubs/{clubId}/invites/{id}/toggle-status
     * Bật/tắt link invite
     */
    public function toggleStatus(int $clubId, int $id): JsonResponse
    {
        $invite = $this->inviteService->toggleStatusClubInvite($clubId, $id);

        return $this->responseCommon(true, __('domains/club_invite.status_toggled'), new ClubInviteResource($invite));
    }
}

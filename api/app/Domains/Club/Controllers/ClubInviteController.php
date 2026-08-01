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
     * GET /api/v1/clubs/{clubSlug}/invites
     * Danh sách link invite của club
     */
    public function index(FilterClubInviteRequest $request, string $clubSlug): JsonResponse
    {
        $invites = $this->inviteService->paginateByClub($clubSlug, $request->validated());

        return $this->paginateResponse($invites, __('domains/club_invite.list'), ClubInviteResource::class);
    }

    /**
     * GET /api/v1/clubs/{clubSlug}/invites/{id}
     */
    public function show(string $clubSlug, int $id): JsonResponse
    {
        $invite = $this->inviteService->findClubInvite($clubSlug, $id);

        return $this->responseCommon(true, __('domains/club_invite.detail'), new ClubInviteResource($invite));
    }

    /**
     * POST /api/v1/clubs/{clubSlug}/invites
     * Tạo link invite mới cho club
     */
    public function store(StoreClubInviteRequest $request, string $clubSlug): JsonResponse
    {
        $invite = $this->inviteService->createClubInvite($clubSlug, $request->validated());

        return $this->responseCommon(true, __('domains/club_invite.created'), new ClubInviteResource($invite), 201);
    }

    /**
     * DELETE /api/v1/clubs/{clubSlug}/invites/{id}
     * Thu hồi link invite
     */
    public function destroy(string $clubSlug, int $id): JsonResponse
    {
        $this->inviteService->deleteClubInvite($clubSlug, $id);

        return $this->responseCommon(true, __('domains/club_invite.deleted'));
    }

    /**
     * POST /api/v1/clubs/{clubSlug}/invites/{id}/toggle-status
     * Bật/tắt link invite
     */
    public function toggleStatus(string $clubSlug, int $id): JsonResponse
    {
        $invite = $this->inviteService->toggleStatusClubInvite($clubSlug, $id);

        return $this->responseCommon(true, __('domains/club_invite.status_toggled'), new ClubInviteResource($invite));
    }
}

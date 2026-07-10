<?php

namespace App\Domains\Club\Controllers;

use App\Base\BaseController;
use App\Domains\Club\Requests\FilterClubMemberRequest;
use App\Domains\Club\Requests\JoinClubRequest;
use App\Domains\Club\Requests\RejectMemberRequest;
use App\Domains\Club\Resources\ClubMemberResource;
use App\Domains\Club\Services\ClubMemberService;
use Illuminate\Http\JsonResponse;

class ClubMemberController extends BaseController
{
    public function __construct(
        protected ClubMemberService $memberService
    ) {}

    /**
     * POST /api/v1/clubs/join
     * User dùng token từ link invite để xin vào club
     *
     * Body: { "token": "xxx..." }
     */
    public function join(JoinClubRequest $request): JsonResponse
    {
        $member = $this->memberService->join(
            $request->user(),
            $request->input('token')
        );

        return $this->responseCommon(true, __('domains/club_member.join_requested'), new ClubMemberResource($member), 201);
    }

    /**
     * GET /api/v1/clubs/{clubId}/members
     * Danh sách thành viên của club (lọc theo status, join_type...)
     */
    public function index(FilterClubMemberRequest $request, int $clubId): JsonResponse
    {
        $members = $this->memberService->paginateClubMembers($clubId, $request->validated());

        return $this->paginateResponse($members, __('domains/club_member.list'));
    }

    /**
     * GET /api/v1/clubs/{clubId}/members/{memberId}
     */
    public function show(int $clubId, int $memberId): JsonResponse
    {
        $member = $this->memberService->findClubMember($clubId, $memberId);

        return $this->responseCommon(true, __('domains/club_member.detail'), new ClubMemberResource($member));
    }

    /**
     * POST /api/v1/clubs/{clubId}/members/{memberId}/approve
     * Chủ club duyệt thành viên → tự động gán role "member"
     */
    public function approve(int $clubId, int $memberId): JsonResponse
    {
        $member = $this->memberService->approve($clubId, $memberId, request()->user());

        return $this->responseCommon(true, __('domains/club_member.approved'), new ClubMemberResource($member));
    }

    /**
     * POST /api/v1/clubs/{clubId}/members/{memberId}/reject
     * Chủ club từ chối thành viên
     *
     * Body: { "rejected_reason": "..." }  (optional)
     */
    public function reject(RejectMemberRequest $request, int $clubId, int $memberId): JsonResponse
    {
        $member = $this->memberService->reject(
            $clubId,
            $memberId,
            $request->user(),
            $request->input('rejected_reason')
        );

        return $this->responseCommon(true, __('domains/club_member.rejected'), new ClubMemberResource($member));
    }

    /**
     * DELETE /api/v1/clubs/{clubId}/members/{memberId}
     * Xoá thành viên khỏi club
     */
    public function destroy(int $clubId, int $memberId): JsonResponse
    {
        $this->memberService->remove($clubId, $memberId);

        return $this->responseCommon(true, __('domains/club_member.removed'));
    }

    /**
     * POST /api/v1/clubs/{clubId}/members/{memberId}/toggle-status
     * Bật/tắt trạng thái thành viên (không thay đổi status pending/approved/rejected)
     */
    public function toggleStatus(int $clubId, int $memberId): JsonResponse
    {
        $member = $this->memberService->toggleStatusClubMember($clubId, $memberId);

        return $this->responseCommon(true, __('domains/club_member.status_toggled'), new ClubMemberResource($member));
    }
}

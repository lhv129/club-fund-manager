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
     * User dùng invite_code từ link invite để xin vào club
     *
     * Body: { "invite_code": "xxx..." }
     */
    public function join(JoinClubRequest $request): JsonResponse
    {
        $member = $this->memberService->join($request->user(), $request->validated());

        return $this->responseCommon(true, __('domains/club_member.join_requested'), new ClubMemberResource($member), 201);
    }

    /**
     * GET /api/v1/clubs/{clubSlug}/members
     * Danh sách thành viên của club (lọc theo status, join_type...)
     */
    public function index(FilterClubMemberRequest $request, string $clubSlug): JsonResponse
    {
        $members = $this->memberService->paginateClubMembers($clubSlug, $request->validated());

        return $this->paginateResponse($members, __('domains/club_member.list'), ClubMemberResource::class);
    }

    /**
     * GET /api/v1/clubs/{clubSlug}/members/{memberId}
     */
    public function show(string $clubSlug, int $memberId): JsonResponse
    {
        $member = $this->memberService->findClubMember($clubSlug, $memberId);

        return $this->responseCommon(true, __('domains/club_member.detail'), new ClubMemberResource($member));
    }

    /**
     * POST /api/v1/clubs/{clubSlug}/members/{memberId}/approve
     * Chủ club duyệt thành viên → tự động gán role "member"
     */
    public function approve(string $clubSlug, int $memberId): JsonResponse
    {
        $member = $this->memberService->approve($clubSlug, $memberId, request()->user());

        return $this->responseCommon(true, __('domains/club_member.approved'), new ClubMemberResource($member));
    }

    /**
     * POST /api/v1/clubs/{clubSlug}/members/{memberId}/reject
     * Chủ club từ chối thành viên
     *
     * Body: { "rejected_reason": "..." }  (optional)
     */
    public function reject(RejectMemberRequest $request, string $clubSlug, int $memberId): JsonResponse
    {
        $member = $this->memberService->reject(
            $clubSlug,
            $memberId,
            $request->user(),
            $request->input('rejected_reason')
        );

        return $this->responseCommon(true, __('domains/club_member.rejected'), new ClubMemberResource($member));
    }

    /**
     * DELETE /api/v1/clubs/{clubSlug}/members/{memberId}
     * Xoá thành viên khỏi club
     */
    public function destroy(string $clubSlug, int $memberId): JsonResponse
    {
        $this->memberService->remove($clubSlug, $memberId, request()->user());

        return $this->responseCommon(true, __('domains/club_member.removed'));
    }
}

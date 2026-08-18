<?php

namespace App\Domains\Club\Controllers;

use App\Base\BaseController;
use App\Domains\Club\Requests\BanMemberRequest;
use App\Domains\Club\Requests\FilterClubMemberRequest;
use App\Domains\Club\Requests\JoinClubRequest;
use App\Domains\Club\Requests\RejectMemberRequest;
use App\Domains\Club\Resources\ClubMemberResource;
use App\Domains\Club\Services\ClubMemberService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClubMemberController extends BaseController
{
    public function __construct(
        protected ClubMemberService $service
    ) {}

    /**
     * POST /api/v1/clubs/join
     *
     * User dùng invite_code / club_slug để xin vào club.
     */
    public function join(JoinClubRequest $request): JsonResponse
    {
        $member = $this->service->join(
            $request->user(),
            $request->validated()
        );

        return $this->responseCommon(
            true,
            __('domains/club_member.join_requested'),
            new ClubMemberResource($member),
            201
        );
    }

    /**
     * GET /api/v1/members
     */
    public function index(FilterClubMemberRequest $request): JsonResponse
    {
        $filters = $request->validated();

        $filters['club_id'] = $request->attributes->get('club_id');

        $members = $this->service->paginate($filters);

        return $this->paginateResponse(
            $members,
            __('domains/club_member.list'),
            ClubMemberResource::class
        );
    }

    /**
     * GET /api/v1/members/{memberId}
     */
    public function show(
        FilterClubMemberRequest $request,
        int $memberId
    ): JsonResponse {
        $clubId = $request->attributes->get('club_id');

        $member = $this->service->findClubMember(
            $clubId,
            $memberId
        );

        return $this->responseCommon(
            true,
            __('domains/club_member.detail'),
            new ClubMemberResource($member)
        );
    }

    /**
     * GET /api/v1/members/select
     */
    public function select(FilterClubMemberRequest $request): JsonResponse
    {
        $filters = $request->validated();

        $filters['club_id'] = $request->attributes->get('club_id');

        return $this->responseCommon(
            true,
            __('domains/club_member.list'),
            $this->service->getForSelect($filters)
        );
    }

    /**
     * POST /api/v1/members/{memberId}/approve
     */
    public function approve(
        FilterClubMemberRequest $request,
        int $memberId
    ): JsonResponse {
        $clubId = $request->attributes->get('club_id');

        $member = $this->service->approve(
            $clubId,
            $memberId,
            $request->user()
        );

        return $this->responseCommon(
            true,
            __('domains/club_member.approved'),
            new ClubMemberResource($member)
        );
    }

    /**
     * POST /api/v1/members/{memberId}/reject
     */
    public function reject(
        RejectMemberRequest $request,
        int $memberId
    ): JsonResponse {
        $clubId = $request->attributes->get('club_id');

        $member = $this->service->reject(
            $clubId,
            $memberId,
            $request->user(),
            $request->input('rejected_reason')
        );

        return $this->responseCommon(
            true,
            __('domains/club_member.rejected'),
            new ClubMemberResource($member)
        );
    }

    /**
     * POST /api/v1/members/{memberId}/ban
     *
     * Ban user khỏi club.
     *
     * Body:
     * {
     *     "banned_reason": "Vi phạm nội quy"
     * }
     */
    public function ban(
        BanMemberRequest $request,
        int $memberId
    ): JsonResponse {
        $clubId = $request->attributes->get('club_id');

        $member = $this->service->ban(
            $clubId,
            $memberId,
            $request->user(),
            $request->input('banned_reason')
        );

        return $this->responseCommon(
            true,
            __('domains/club_member.banned'),
            new ClubMemberResource($member)
        );
    }

    /**
     * DELETE /api/v1/members/{memberId}
     *
     * Remove member đã approved khỏi club.
     */
    public function destroy(
        FilterClubMemberRequest $request,
        int $memberId
    ): JsonResponse {
        $clubId = $request->attributes->get('club_id');

        $this->service->remove(
            $clubId,
            $memberId,
            $request->user()
        );

        return $this->responseCommon(
            true,
            __('domains/club_member.removed')
        );
    }


    public function getClubAdministrators(Request $request)
    {
        $clubId = $request->attributes->get('club_id');
        $managers = $this->service->getClubAdministrators($clubId);
        return $this->responseCommon(true, 'Lấy thành công danh sách quản trị viên của club', $managers, 200);
    }
}

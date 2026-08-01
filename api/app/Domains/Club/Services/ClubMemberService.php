<?php

namespace App\Domains\Club\Services;

use App\Base\BaseService;
use App\Domains\Club\Models\ClubMember;
use App\Domains\Club\Repositories\ClubInviteRepository;
use App\Domains\Club\Repositories\ClubMemberRepository;
use App\Domains\Club\Repositories\ClubMemberRoleRepository;
use App\Domains\Role\Repositories\RoleRepository;
use App\Domains\User\Models\User;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClubMemberService extends BaseService
{
    protected string $notFoundMessage = 'domains/club_member.not_found';

    public function __construct(
        ClubMemberRepository $repository,
        protected ClubInviteRepository $inviteRepository,
        protected RoleRepository $roleRepository,
        protected ClubMemberRoleRepository $clubMemberRoleRepository,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    public function paginateClubMembers(string $clubSlug, array $params = []): LengthAwarePaginator
    {
        return $this->repository->paginateClubMembers($clubSlug, $params);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function findClubMember(string $clubSlug, int $memberId): ClubMember
    {
        $member = $this->repository->findByClubSlugAndMemberId(
            clubSlug: $clubSlug,
            with: [
                'user:id,fullname,phone,email,avatar',
                'reviewedBy',
                'invitedBy',
                'removedBy',
                'user.clubMemberRoles.role.translation',
            ],
            memberId: $memberId,
        );

        if (! $member) {
            throw new ApiException(__('domains/club_member.not_found'), 404);
        }

        return $member;
    }

    // -------------------------------------------------------------------------
    // Join via invite link
    // -------------------------------------------------------------------------

    /**
     * User dùng invite_code link invite để xin vào club.
     *
     * Kiểm tra:
     *   1. invite_code tồn tại, còn hạn, còn active
     *   2. User chưa là member của club đó (kể cả pending/rejected)
     */
    public function join(User $user, string $inviteCode): ClubMember
    {
        // 1. Tìm invite hợp lệ
        $invite = $this->inviteRepository->findValidByToken($inviteCode);

        if (! $invite) {
            throw new ApiException(__('domains/club_invite.invalid_or_expired'), 422);
        }

        // 2. Kiểm tra đã từng tham gia club chưa
        $existing = $this->repository->first([
            'club_id' => $invite->club_id,
            'user_id' => $user->id,
        ]);

        if ($existing) {

            switch ($existing->status) {

                case 'pending':
                    throw new ApiException(__('domains/club_member.already_pending'), 422);

                case 'approved':
                    throw new ApiException(__('domains/club_member.already_member'), 422);

                case 'rejected':
                    throw new ApiException(__('domains/club_member.was_rejected'), 422);

                case 'removed':
                    $member = $this->repository->update($existing, [
                        'join_type'       => 'invite',
                        'invite_id'       => $invite->id,
                        'invited_by'      => $invite->created_by,

                        'status'          => 'pending',

                        'reviewed_by'     => null,
                        'reviewed_at'     => null,
                        'rejected_reason' => null,

                        'removed_by'      => null,
                        'removed_at'      => null,

                        'joined_at'       => null,
                        'is_active'       => true,
                    ]);

                    $this->inviteRepository->increment(
                        ['id' => $invite->id],
                        'used_count'
                    );

                    return $member->load([
                        'user',
                        'invitedBy',
                    ]);
            }
        }

        // 3. Tạo bản ghi mới
        $member = $this->repository->create([
            'club_id'    => $invite->club_id,
            'user_id'    => $user->id,
            'join_type'  => 'invite',
            'invite_id'  => $invite->id,
            'invited_by' => $invite->created_by,
            'status'     => 'pending',
        ]);

        // 4. Tăng số lần sử dụng invite
        $this->inviteRepository->increment(
            ['id' => $invite->id],
            'used_count'
        );

        return $member->load([
            'user',
            'invitedBy',
        ]);
    }

    // -------------------------------------------------------------------------
    // Approve
    // -------------------------------------------------------------------------

    /**
     * Chủ club duyệt member:
     *   1. Cập nhật status → approved
     *   2. Tự động gán role mặc định slug='member' của club đó
     *      (nếu role chưa tồn tại thì bỏ qua, không throw error)
     */
    public function approve(string $clubSlug, int $memberId, User $reviewer): ClubMember
    {
        $member = $this->findPending($clubSlug, $memberId);

        // 1. Cập nhật trạng thái
        $member = $this->repository->update($member, [
            'status'       => 'approved',
            'reviewed_by'  => $reviewer->id,
            'reviewed_at'  => now(),
            'joined_at'    => now(),

            'removed_by'   => null,
            'removed_at'   => null,

            'is_active'    => true,
        ]);

        // 2. Tìm role mặc định slug='member' trong club
        $defaultRole = $this->roleRepository->first([
            'slug'    => 'member',
            'is_active' => true,
        ]);

        // 3. Gán role nếu có
        if ($defaultRole) {
            $this->clubMemberRoleRepository->restoreOrAssignRole(
                $member,
                $defaultRole->id
            );
        }

        return $member->load(['user', 'reviewedBy', 'user.clubMemberRoles.role.translations']);
    }

    // -------------------------------------------------------------------------
    // Reject
    // -------------------------------------------------------------------------

    public function reject(string $clubSlug, int $memberId, User $reviewer, ?string $reason = null): ClubMember
    {
        $member = $this->findPending($clubSlug, $memberId);

        $member = $this->repository->update($member, [
            'status'          => 'rejected',
            'reviewed_by'     => $reviewer->id,
            'reviewed_at'     => now(),
            'rejected_reason' => $reason,
        ]);

        return $member->load(['user', 'reviewedBy']);
    }

    // -------------------------------------------------------------------------
    // Remove / Toggle
    // -------------------------------------------------------------------------

    public function remove(string $clubSlug, int $memberId, User $removedBy): ClubMember
    {
        $member = $this->findClubMember($clubSlug, $memberId);

        // Không cho xóa khi chưa được duyệt
        if ($member->status !== 'approved' && $member->status !== 'rejected') {
            throw new ApiException(__('domains/club_member.not_approved'), 422);
        }

        // Xóa toàn bộ role của member
        $this->clubMemberRoleRepository->removeMemberRoles($member);

        // Chuyển trạng thái
        $this->repository->update($member, [
            'status'           => 'removed',
            'is_active'        => false,

            'removed_by'       => $removedBy->id,
            'removed_at'       => now(),

            'reviewed_by'      => null,
            'reviewed_at'      => null,
            'rejected_reason'  => null,
        ]);

        return $member->fresh([
            'user',
            'reviewedBy',
            'removedBy',
            'invitedBy',
            'user.clubMemberRoles.role.translation',
        ]);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Tìm member đang pending — dùng cho approve/reject.
     */
    private function findPending(string $clubSlug, int $memberId): ClubMember
    {
        $member = $this->repository->findPendingByClubSlugAndMemberId(
            clubSlug: $clubSlug,
            memberId: $memberId
        );

        if (! $member) {
            throw new ApiException(__('domains/club_member.not_pending'), 422);
        }

        return $member;
    }
}

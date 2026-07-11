<?php

namespace App\Domains\Club\Services;

use App\Base\BaseService;
use App\Domains\Club\Repositories\ClubInviteRepository;
use App\Domains\Club\Models\ClubMember;
use App\Domains\Club\Repositories\ClubMemberRepository;
use App\Domains\Role\Repositories\RoleRepository;
use App\Domains\User\Models\User;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class ClubMemberService extends BaseService
{
    protected string $notFoundMessage = 'domains/club_member.not_found';

    public function __construct(
        ClubMemberRepository              $repository,
        protected ClubInviteRepository    $inviteRepository,
        protected RoleRepository          $roleRepository,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    public function paginateClubMembers(int $clubId, array $params = []): LengthAwarePaginator
    {
        $where = $this->buildWhere($params, ['status', 'join_type', 'is_active']);
        $where['club_id'] = $clubId;

        // Tìm theo tên / email user
        if (!empty($params['search'])) {
            $where['whereHas'] = [['user', ['name' => ['name', 'like', $params['search']]]]];
        }

        $orderBy = $this->buildOrderBy($params, ['id', 'joined_at', 'created_at']);

        return $this->repository->paginate(
            where:   $where,
            orderBy: $orderBy,
            select:  ['id', 'club_id', 'user_id', 'join_type', 'status', 'is_active', 'joined_at', 'created_at'],
            with:    ['user'],
            limit:   (int) ($params['limit'] ?? 0),
            page:    (int) ($params['page'] ?? 1),
        );
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function findClubMember(int $clubId, int $memberId): ClubMember
    {
        $member = $this->repository->first(
            where:  ['id' => $memberId, 'club_id' => $clubId],
            with:   ['user', 'reviewer', 'invite', 'roles.translations'],
            select: ['*'],
        );

        if (!$member) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $member;
    }

    // -------------------------------------------------------------------------
    // Join via invite link
    // -------------------------------------------------------------------------

    /**
     * User dùng token link invite để xin vào club.
     *
     * Kiểm tra:
     *   1. Token tồn tại, còn hạn, còn active
     *   2. User chưa là member của club đó (kể cả pending/rejected)
     */
    public function join(User $user, string $token): ClubMember
    {
        // 1. Tìm invite hợp lệ
        $invite = $this->inviteRepository->findValidByToken($token);

        if (!$invite) {
            throw new ApiException(__('domains/club_invite.invalid_or_expired'), 422);
        }

        // 2. Kiểm tra đã là member chưa (kể cả đang pending / đã bị reject)
        $existing = $this->repository->first([
            'club_id' => $invite->club_id,
            'user_id' => $user->id,
        ]);

        if ($existing) {
            match ($existing->status) {
                'pending'  => throw new ApiException(__('domains/club_member.already_pending'), 422),
                'approved' => throw new ApiException(__('domains/club_member.already_member'), 422),
                'rejected' => throw new ApiException(__('domains/club_member.was_rejected'), 422),
            };
        }

        // 3. Tạo bản ghi pending
        $member = $this->repository->create([
            'club_id'   => $invite->club_id,
            'user_id'   => $user->id,
            'join_type' => 'invite',
            'invite_id' => $invite->id,
            'status'    => 'pending',
        ]);

        // 4. Tăng used_count của invite
        $this->inviteRepository->increment(['id' => $invite->id], 'used_count');

        return $member->load(['user', 'invite']);
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
    public function approve(int $clubId, int $memberId, User $reviewer): ClubMember
    {
        $member = $this->findPending($clubId, $memberId);

        // 1. Cập nhật trạng thái
        $member = $this->repository->update($member, [
            'status'      => 'approved',
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'joined_at'   => now(),
        ]);

        // 2. Tìm role mặc định slug='member' trong club
        $defaultRole = $this->roleRepository->first([
            'club_id' => $clubId,
            'slug'    => 'member',
            'is_active' => true,
        ]);

        // 3. Gán role nếu có
        if ($defaultRole) {
            $this->repository->assignRole($member, $defaultRole->id);
        }

        return $member->load(['user', 'reviewer', 'roles.translations']);
    }

    // -------------------------------------------------------------------------
    // Reject
    // -------------------------------------------------------------------------

    public function reject(int $clubId, int $memberId, User $reviewer, ?string $reason = null): ClubMember
    {
        $member = $this->findPending($clubId, $memberId);

        $member = $this->repository->update($member, [
            'status'          => 'rejected',
            'reviewed_by'     => $reviewer->id,
            'reviewed_at'     => now(),
            'rejected_reason' => $reason,
        ]);

        return $member->load(['user', 'reviewer']);
    }

    // -------------------------------------------------------------------------
    // Remove / Toggle
    // -------------------------------------------------------------------------

    public function remove(int $clubId, int $memberId): bool
    {
        $member = $this->findClubMember($clubId, $memberId);
        return $this->repository->delete($member);
    }

    public function toggleStatusClubMember(int $clubId, int $memberId): ClubMember
    {
        $member = $this->findClubMember($clubId, $memberId);
        $member->is_active = !$member->is_active;
        $member->save();

        return $member->fresh(['user', 'roles.translations']);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Tìm member đang pending — dùng cho approve/reject.
     */
    private function findPending(int $clubId, int $memberId): ClubMember
    {
        $member = $this->repository->first([
            'id'      => $memberId,
            'club_id' => $clubId,
            'status'  => 'pending',
        ]);

        if (!$member) {
            throw new ApiException(__('domains/club_member.not_pending'), 422);
        }

        return $member;
    }
}

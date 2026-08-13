<?php

namespace App\Domains\Club\Services;

use App\Base\BaseService;
use App\Domains\Club\Models\ClubMember;
use App\Domains\Club\Repositories\ClubInviteRepository;
use App\Domains\Club\Repositories\ClubMemberRepository;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\ClubMemberRole\Repositories\ClubMemberRoleRepository;
use App\Domains\FundPeriod\Repositories\FundPeriodRepository;
use App\Domains\MonthlyContribution\Services\MonthlyContributionService;
use App\Domains\Role\Repositories\RoleRepository;
use App\Domains\User\Models\User;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ClubMemberService extends BaseService
{
    protected string $notFoundMessage = 'domains/club_member.not_found';

    public function __construct(
        ClubMemberRepository $repository,
        protected ClubInviteRepository $inviteRepository,
        protected RoleRepository $roleRepository,
        protected ClubMemberRoleRepository $clubMemberRoleRepository,
        protected ClubRepository $clubRepository,

        protected FundPeriodRepository $fundPeriodRepository,
        protected MonthlyContributionService $monthlyContributionService,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    public function paginate(array $params = []): LengthAwarePaginator
    {
        return $this->repository->getList($params);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function findClubMember(
        int $clubId,
        int $memberId
    ): ClubMember {
        $member = $this->repository->findByClubIdAndMemberId(
            clubId: $clubId,
            memberId: $memberId,
            with: [
                'user:id,fullname,phone,email,avatar',
                'reviewedBy',
                'invitedBy',
                'removedBy',
                'bannedBy',
                'user.clubMemberRoles.role.translation',
            ],
        );

        if (! $member) {
            throw new ApiException(
                __('domains/club_member.not_found'),
                404
            );
        }

        return $member;
    }

    public function getForSelect(array $filters = [])
    {
        return $this->repository->getForSelect($filters);
    }

    // -------------------------------------------------------------------------
    // Join
    // -------------------------------------------------------------------------

    /**
     * User xin tham gia club.
     *
     * State:
     *
     * pending
     *   -> không join lại
     *
     * approved
     *   -> không join lại
     *
     * rejected
     *   -> được join lại
     *
     * removed
     *   -> được join lại
     *
     * banned
     *   -> TUYỆT ĐỐI không được join lại
     */
    public function join(
        User $user,
        array $data
    ): ClubMember {
        $inviteCode = $data['invite_code'] ?? null;
        $clubSlug   = $data['club_slug'] ?? null;

        if (! $inviteCode && ! $clubSlug) {
            throw new ApiException(
                __('domains/club_member.join_source_required'),
                422
            );
        }

        $invite = null;

        // ---------------------------------------------------------------------
        // Join bằng Invite Code
        // ---------------------------------------------------------------------

        if ($inviteCode) {
            $invite = $this->inviteRepository->findValidByToken(
                $inviteCode
            );

            if (! $invite) {
                throw new ApiException(
                    __('domains/club_invite.invalid_or_expired'),
                    422
                );
            }

            $clubId    = $invite->club_id;
            $joinType  = 'invite';
            $inviteId  = $invite->id;
            $invitedBy = $invite->created_by;
        }

        // ---------------------------------------------------------------------
        // Join bằng Club Slug
        // ---------------------------------------------------------------------

        else {
            $club = $this->clubRepository->findByTranslationSlug(
                $clubSlug,
                ['*'],
                [
                    'is_active' => true,
                ]
            );

            if (! $club) {
                throw new ApiException(
                    __('domains/club.not_found'),
                    404
                );
            }

            $clubId    = $club->id;
            $joinType  = 'request';
            $inviteId  = null;
            $invitedBy = null;
        }

        // ---------------------------------------------------------------------
        // Kiểm tra member hiện tại
        // ---------------------------------------------------------------------

        $existing = $this->repository->findByClubIdAndUserId(
            $clubId,
            $user->id
        );

        if ($existing) {
            switch ($existing->status) {

                // -------------------------------------------------------------
                // Pending
                // -------------------------------------------------------------

                case 'pending':
                    throw new ApiException(
                        __('domains/club_member.already_pending'),
                        422
                    );

                    // -------------------------------------------------------------
                    // Approved
                    // -------------------------------------------------------------

                case 'approved':
                    throw new ApiException(
                        __('domains/club_member.already_member'),
                        422
                    );

                    // -------------------------------------------------------------
                    // Rejected
                    //
                    // Cho phép request lại.
                    // -------------------------------------------------------------

                case 'rejected':
                    $member = $this->repository->update(
                        $existing,
                        [
                            'join_type'       => $joinType,
                            'invite_id'       => $inviteId,
                            'invited_by'      => $invitedBy,

                            'status'          => 'pending',

                            'reviewed_by'     => null,
                            'reviewed_at'     => null,
                            'rejected_reason' => null,

                            'removed_by'      => null,
                            'removed_at'      => null,

                            'joined_at'       => null,

                            'is_active'       => true,
                        ]
                    );

                    $this->incrementInviteUsage($invite);

                    return $member->load([
                        'user',
                        'invitedBy',
                    ]);

                    // -------------------------------------------------------------
                    // Removed
                    //
                    // Cho phép request lại.
                    // -------------------------------------------------------------

                case 'removed':
                    $member = $this->repository->update(
                        $existing,
                        [
                            'join_type'       => $joinType,
                            'invite_id'       => $inviteId,
                            'invited_by'      => $invitedBy,

                            'status'          => 'pending',

                            'reviewed_by'     => null,
                            'reviewed_at'     => null,
                            'rejected_reason' => null,

                            'removed_by'      => null,
                            'removed_at'      => null,

                            'joined_at'       => null,

                            'is_active'       => true,
                        ]
                    );

                    $this->incrementInviteUsage($invite);

                    return $member->load([
                        'user',
                        'invitedBy',
                    ]);

                    // -------------------------------------------------------------
                    // Banned
                    //
                    // KHÔNG cho phép join lại.
                    // -------------------------------------------------------------

                case 'banned':
                    throw new ApiException(
                        __('domains/club_member.banned'),
                        403
                    );
            }
        }

        // ---------------------------------------------------------------------
        // Tạo member mới
        // ---------------------------------------------------------------------

        $member = $this->repository->create([
            'club_id'    => $clubId,
            'user_id'    => $user->id,
            'join_type'  => $joinType,
            'invite_id'  => $inviteId,
            'invited_by' => $invitedBy,
            'status'     => 'pending',
            'is_active'  => true,
        ]);

        $this->incrementInviteUsage($invite);

        return $member->load([
            'user',
            'invitedBy',
        ]);
    }

    // -------------------------------------------------------------------------
    // Approve
    // -------------------------------------------------------------------------

    /**
     * pending -> approved
     */
    public function approve(
        int $clubId,
        int $memberId,
        User $reviewer
    ): ClubMember {
        return DB::transaction(function () use (
            $clubId,
            $memberId,
            $reviewer
        ) {
            $member = $this->findPending(
                $clubId,
                $memberId
            );

            // ---------------------------------------------------------------------
            // pending -> approved
            // ---------------------------------------------------------------------

            $member = $this->repository->update(
                $member,
                [
                    'status'      => 'approved',
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now(),
                    'joined_at'   => now(),

                    'removed_by'  => null,
                    'removed_at'  => null,

                    'is_active'   => true,
                ]
            );

            // ---------------------------------------------------------------------
            // Role mặc định member
            // ---------------------------------------------------------------------

            $defaultRole = $this->roleRepository->first([
                'slug'      => 'member',
                'is_active' => true,
            ]);

            if ($defaultRole) {
                $this->clubMemberRoleRepository->restoreOrAssignRole(
                    $member,
                    $defaultRole->id
                );
            }

            // ---------------------------------------------------------------------
            // Tạo MonthlyContribution cho tháng hiện tại
            //
            // Nếu tháng hiện tại chưa có FundPeriod:
            // => vẫn approve member
            // => không tạo contribution
            // ---------------------------------------------------------------------

            $period = $this->fundPeriodRepository->findByClubAndDate(
                $member->club_id,
                now()->year,
                now()->month
            );

            if ($period) {
                $this->monthlyContributionService
                    ->createForApprovedMember(
                        $member,
                        $period
                    );
            }

            return $member->load([
                'user',
                'reviewedBy',
                'user.clubMemberRoles.role.translations',
            ]);
        });
    }

    // -------------------------------------------------------------------------
    // Reject
    // -------------------------------------------------------------------------

    /**
     * pending -> rejected
     *
     * rejected có thể join lại.
     */
    public function reject(
        int $clubId,
        int $memberId,
        User $reviewer,
        ?string $reason = null
    ): ClubMember {
        $member = $this->findPending(
            $clubId,
            $memberId
        );

        $member = $this->repository->update(
            $member,
            [
                'status'          => 'rejected',
                'reviewed_by'     => $reviewer->id,
                'reviewed_at'     => now(),
                'rejected_reason' => $reason,

                'is_active'       => false,
            ]
        );

        return $member->load([
            'user',
            'reviewedBy',
        ]);
    }

    // -------------------------------------------------------------------------
    // Remove
    // -------------------------------------------------------------------------

    /**
     * approved -> removed
     *
     * Chỉ approved mới được remove.
     */
    public function remove(
        int $clubId,
        int $memberId,
        User $removedBy
    ): ClubMember {
        $member = $this->findClubMember(
            $clubId,
            $memberId
        );

        if ($member->status !== 'approved') {
            throw new ApiException(
                __('domains/club_member.not_approved'),
                422
            );
        }

        // ---------------------------------------------------------------------
        // Xóa role
        // ---------------------------------------------------------------------

        $this->clubMemberRoleRepository->removeMemberRoles(
            $member
        );

        // ---------------------------------------------------------------------
        // approved -> removed
        // ---------------------------------------------------------------------

        $this->repository->update(
            $member,
            [
                'status'          => 'removed',
                'is_active'       => false,

                'removed_by'      => $removedBy->id,
                'removed_at'      => now(),

                'reviewed_by'     => null,
                'reviewed_at'     => null,
                'rejected_reason' => null,
            ]
        );

        return $member->fresh([
            'user',
            'reviewedBy',
            'removedBy',
            'invitedBy',
            'bannedBy',
            'user.clubMemberRoles.role.translation',
        ]);
    }

    // -------------------------------------------------------------------------
    // Ban
    // -------------------------------------------------------------------------

    /**
     * Ban user khỏi club.
     *
     * Có thể ban member ở các trạng thái:
     *
     * - pending
     * - approved
     * - rejected
     * - removed
     *
     * Không thể ban lại member đã banned.
     *
     * Khi banned:
     *
     * - is_active = false
     * - toàn bộ role bị remove
     * - user không thể join lại club
     */
    public function ban(
        int $clubId,
        int $memberId,
        User $bannedBy,
        ?string $reason = null
    ): ClubMember {
        $member = $this->findClubMember(
            $clubId,
            $memberId
        );

        // ---------------------------------------------------------------------
        // Không ban lại member đã banned
        // ---------------------------------------------------------------------

        if ($member->status === 'banned') {
            throw new ApiException(
                __('domains/club_member.already_banned'),
                422
            );
        }

        // ---------------------------------------------------------------------
        // Không cho ban chính mình
        // ---------------------------------------------------------------------

        if ((int) $member->user_id === (int) $bannedBy->id) {
            throw new ApiException(
                __('domains/club_member.cannot_ban_self'),
                422
            );
        }

        // ---------------------------------------------------------------------
        // Nếu đang approved thì phải remove role trước
        //
        // Nhưng thực tế nên remove role cho mọi trường hợp để đảm bảo
        // banned user không còn quyền trong club.
        // ---------------------------------------------------------------------

        $this->clubMemberRoleRepository->removeMemberRoles(
            $member
        );

        // ---------------------------------------------------------------------
        // Chuyển -> banned
        // ---------------------------------------------------------------------

        $member = $this->repository->update(
            $member,
            [
                'status'          => 'banned',
                'is_active'       => false,

                'banned_by'       => $bannedBy->id,
                'banned_at'       => now(),
                'banned_reason'   => $reason,

                'reviewed_by'     => null,
                'reviewed_at'     => null,

                'removed_by'      => null,
                'removed_at'      => null,

                'joined_at'       => null,
                'rejected_reason' => null,
            ]
        );

        return $member->fresh([
            'user',
            'reviewedBy',
            'invitedBy',
            'removedBy',
            'bannedBy',
            'user.clubMemberRoles.role.translation',
        ]);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Tìm member pending.
     */
    private function findPending(
        int $clubId,
        int $memberId
    ): ClubMember {
        $member = $this->repository->findPendingByClubIdAndMemberId(
            clubId: $clubId,
            memberId: $memberId
        );

        if (! $member) {
            throw new ApiException(
                __('domains/club_member.not_pending'),
                422
            );
        }

        return $member;
    }

    /**
     * Tăng used_count của invite.
     */
    private function incrementInviteUsage($invite): void
    {
        if (! $invite) {
            return;
        }

        $this->inviteRepository->increment(
            ['id' => $invite->id],
            'used_count'
        );
    }
}

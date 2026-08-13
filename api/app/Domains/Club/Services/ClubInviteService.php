<?php

namespace App\Domains\Club\Services;

use App\Base\BaseService;
use App\Domains\Club\Models\ClubInvite;
use App\Domains\Club\Repositories\ClubInviteRepository;
use App\Domains\Club\Repositories\ClubRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ClubInviteService extends BaseService
{
    protected string $notFoundMessage = 'domains/club_invite.not_found';

    public function __construct(
        ClubInviteRepository $repository,
        protected ClubRepository $clubRepository,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function findClubInvite(string $clubSlug, int $id): ClubInvite
    {
        $invite = $this->repository->findByClubSlug($clubSlug, $id);

        if (!$invite) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $invite;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * Tạo link invite mới cho club.
     *
     * Business rules:
     *   1. Mỗi user chỉ được có 1 link còn hiệu lực tại 1 thời điểm.
     *      → Nếu đã có link active + chưa hết hạn thì trả lại link đó, không tạo mới.
     *   2. expires_at mặc định = 1 tuần kể từ thời điểm tạo (nếu caller không truyền).
     */
    public function createClubInvite(string $clubSlug, array $data): ClubInvite
    {
        $club = $this->clubRepository->findByTranslationSlug($clubSlug);

        if (!$club) {
            throw new ApiException(__('domains/club.not_found'), 404);
        }

        $userId = Auth::id();

        // Rule 1: Trả lại link hiện có nếu vẫn còn hiệu lực
        $existing = $this->repository->findActiveByUserAndClub($userId, $club->id);

        if ($existing) {
            return $existing;
        }

        // Rule 2: expires_at mặc định 1 tuần
        $data['club_id']    = $club->id;
        $data['created_by'] = $userId;
        $data['invite_code']      = $this->generateUniqueToken();
        $data['expires_at'] = $data['expires_at'] ?? now()->addWeek();

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        }

        $invite = $this->repository->create($data);
        return $invite->load('club');
    }

    public function deleteClubInvite(string $clubSlug, int $id): bool
    {
        $invite = $this->findClubInvite($clubSlug, $id);

        return $this->repository->delete($invite);
    }

    public function toggleStatusClubInvite(string $clubSlug, int $id): ClubInvite
    {
        $invite = $this->findClubInvite($clubSlug, $id);

        $invite->is_active = !$invite->is_active;
        $invite->save();

        return $invite->fresh('createdBy');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Sinh inviteCode 6 ký tự đảm bảo không trùng trong DB.
     */
    private function generateUniqueToken(): string
    {
        do {
            $inviteCode = Str::random(6);
        } while ($this->repository->count(['invite_code' => $inviteCode]) > 0);

        return $inviteCode;
    }
}

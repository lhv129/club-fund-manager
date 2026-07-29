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

    public function paginateByClub(string $clubSlug, array $params = []): LengthAwarePaginator
    {
        return $this->repository->paginateByClub($clubSlug, $params);
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
     * Tạo link invite mới.
     */
    public function createClubInvite(string $clubSlug, array $data): ClubInvite
    {
        $club = $this->clubRepository->findByTranslationSlug($clubSlug);

        if (!$club) {
            throw new ApiException(__('domains/club.not_found'), 404);
        }

        $data['club_id'] = $club->id;
        $data['created_by'] = Auth::id();
        $data['token'] = $this->generateUniqueToken();

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        }

        return $this->repository->create($data);
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
     * Sinh token 64 ký tự đảm bảo không trùng.
     */
    private function generateUniqueToken(): string
    {
        do {
            $token = Str::random(64);
        } while ($this->repository->count(['token' => $token]) > 0);

        return $token;
    }
}

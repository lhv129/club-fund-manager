<?php

namespace App\Domains\Club\Services;

use App\Base\BaseService;
use App\Domains\Club\Models\ClubInvite;
use App\Domains\Club\Repositories\ClubInviteRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class ClubInviteService extends BaseService
{
    protected string $notFoundMessage = 'domains/club_invite.not_found';

    public function __construct(ClubInviteRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    public function paginateClubInvites(int $clubId, array $params = []): LengthAwarePaginator
    {
        $where   = $this->buildWhere($params, ['is_active']);
        $where['club_id'] = $clubId;

        $orderBy = $this->buildOrderBy($params, ['id', 'sort_order', 'created_at', 'expires_at']);

        return $this->repository->paginate(
            where:   $where,
            orderBy: $orderBy,
            select:  ['id', 'club_id', 'created_by', 'token', 'expires_at', 'used_count', 'sort_order', 'is_active', 'created_at'],
            with:    ['creator'],
            limit:   (int) ($params['limit'] ?? 0),
            page:    (int) ($params['page'] ?? 1),
        );
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function findClubInvite(int $clubId, int $id): ClubInvite
    {
        $invite = $this->repository->first(
            where:  ['id' => $id, 'club_id' => $clubId],
            with:   ['creator'],
            select: ['*'],
        );

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
     * Token 64 ký tự ngẫu nhiên, unique.
     *
     * $data = [
     *   'expires_at'  => '2026-12-31 23:59:59',  // optional
     *   'sort_order'  => 1,                        // optional
     *   'is_active'   => true,                     // default true
     * ]
     */
    public function createClubInvite(int $clubId, array $data): ClubInvite
    {
        $data['club_id'] = $clubId;
        $data['created_by'] = Auth::id();
        $data['token'] = $this->generateUniqueToken();

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        }

        return $this->repository->create($data);
    }

    public function deleteClubInvite(int $clubId, int $id): bool
    {
        $invite = $this->findClubInvite($clubId, $id);
        return $this->repository->delete($invite);
    }

    public function toggleStatusClubInvite(int $clubId, int $id): ClubInvite
    {
        $invite = $this->findClubInvite($clubId, $id);
        $invite->is_active = !$invite->is_active;
        $invite->save();

        return $invite->fresh('creator');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Sinh token 64 ký tự đảm bảo không trùng trong DB.
     */
    private function generateUniqueToken(): string
    {
        do {
            $token = Str::random(64);
        } while ($this->repository->count(['token' => $token]) > 0);

        return $token;
    }
}

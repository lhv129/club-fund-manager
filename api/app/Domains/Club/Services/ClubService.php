<?php

namespace App\Domains\Club\Services;

use App\Base\BaseService;
use App\Domains\Club\Models\Club;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\User\Models\User;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;

class ClubService extends BaseService
{
    protected string $notFoundMessage = 'domains/club.not_found';
    protected object $repository;

    public function __construct(ClubRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * Superadmin -> tất cả clubs (có phân trang chuẩn BaseRepository)
     * Manager/Member -> chỉ clubs mình đã được approved
     *
     * Params:
     *   search     string   tìm theo name (trong translations)
     *   is_active  0|1
     *   sort_by    string   cột sort
     *   sort_dir   string   asc|desc
     *   limit      int
     *   page       int
     */
    public function index(User $user, array $filters): mixed
    {
        if ($user->isSuperAdmin()) {
            return $this->repository->getAll($filters);
        }

        return $this->repository->getByUser($user->id, $filters);
    }

    /**
     * GET /api/v1/admin/clubs  (chỉ Superadmin dùng endpoint admin)
     */
    public function paginate(array $params = []): LengthAwarePaginator
    {
        return $this->repository->getAll($params);
    }

    /**
     * GET /api/v1/clubs/cursor
     */
    public function cursorPaginate(array $params = []): \Illuminate\Contracts\Pagination\CursorPaginator
    {
        $where = $this->buildWhere($params, ['is_active']);

        if (!empty($params['search'])) {
            $where['whereHas'] = [['translations', ['name' => ['name', 'like', $params['search']]]]];
        }

        return $this->repository->cursorPaginate(
            where: $where,
            orderBy: ['sort_order' => 'asc', 'id' => 'desc'],
            select: ['id', 'max_members', 'logo', 'is_active', 'sort_order', 'created_at'],
            with: ['translations'],
            limit: (int) ($params['limit'] ?? 0),
        );
    }

    /**
     * GET /api/v1/clubs/select  — dropdown list
     */
    public function getForSelect(array $params = []): Collection
    {
        $where = $this->buildWhere($params, ['is_active']);

        if (!empty($params['search'])) {
            $where['whereHas'] = [['translations', ['name' => ['name', 'like', $params['search']]]]];
        }

        return $this->repository->get(
            where: $where,
            orderBy: ['sort_order' => 'asc', 'id' => 'asc'],
            select: ['id', 'max_members', 'logo'],
            with: ['translations'],
            limit: min((int) ($params['limit'] ?? 20), 50),
        );
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): Club
    {
        $club = $this->repository->first(
            where: ['id' => $id],
            with: ['translations'],
            select: ['*'],
        );

        if (!$club) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $club;
    }

    public function findBySlug(string $slug): Club
    {
        $club = $this->repository->findByTranslationSlug(
            slug: $slug,
            conditions: ['is_active' => 1],
        );

        if (!$club) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $club; // translations đã được load sẵn trong repository
    }


    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * Tạo club kèm translations.
     *
     * $data = [
     *   'logo'       => 'path/logo.png',
     *   'is_active'  => 1,
     *   'sort_order' => 1,          // optional — tự sinh nếu thiếu
     *   'translations' => [
     *       ['locale' => 'vi', 'name' => 'CLB Bóng Đá', 'description' => '...'],
     *       ['locale' => 'en', 'name' => 'Football Club', 'description' => '...'],
     *   ],
     * ]
     */
    public function create(array $data): Club
    {
        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        } else {
            $this->repository->applySortOrder($data['sort_order']);
        }

        return $this->repository->createWithTranslations($data, $translations);
    }

    /**
     * Cập nhật club kèm translations (upsert theo locale).
     */
    public function update(int $id, array $data): Club
    {
        $club = $this->find($id);

        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        if (isset($data['sort_order']) && $data['sort_order'] !== $club->sort_order) {
            $this->repository->applySortOrder($data['sort_order'], $club->id, $club->sort_order);
        }

        return $this->repository->updateWithTranslations($club, $data, $translations);
    }

    /**
     * Xoá club và dịch chuyển sort_order.
     */
    public function delete(int $id): bool
    {
        return $this->deleteWithSortOrder($id);
    }

    /**
     * Toggle is_active 0|1.
     */
    public function toggleStatus(int $id): Club
    {
        $club = $this->find($id);
        $club->is_active = !$club->is_active;
        $club->save();

        return $club->fresh('translations');
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    public function count(array $params = []): int
    {
        $where = $this->buildWhere($params, ['is_active']);

        if (!empty($params['search'])) {
            $where['whereHas'] = [['translations', ['name' => ['name', 'like', $params['search']]]]];
        }

        return $this->repository->count($where);
    }

    /**
     * Gán hoặc thay đổi chủ sở hữu của club.
     * - Cập nhật owner_id trên bảng clubs.
     * - Đảm bảo owner có một bản ghi approved trong club_members.
     */
    public function updateOwner(int $clubId, int $newOwnerId): Club
    {
        $club = $this->find($clubId);

        return $this->repository->updateOwner($club, $newOwnerId);
    }
}

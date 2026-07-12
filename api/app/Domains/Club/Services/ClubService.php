<?php

namespace App\Domains\Club\Services;

use App\Base\BaseService;
use App\Domains\Club\Models\Club;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\User\Models\User;
use App\Exceptions\ApiException;
use App\Helpers\ImageHelper;
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
     * Superadmin -> tất cả clubs
     * Manager/Member -> chỉ clubs mình được approved
     */
    public function index(User $user, array $filters): mixed
    {
        if ($user->isSuperAdmin()) {
            return $this->repository->getAll($filters);
        }

        return $this->repository->getByUser($user->id, $filters);
    }

    public function paginate(array $params = []): LengthAwarePaginator
    {
        return $this->repository->getAll($params);
    }

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

        return $club;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * Tạo club kèm translations.
     *
     * Vì path logo cần chứa clubId (/uploads/clubs/{id}/logo/file.webp),
     * phải tạo club trước → lấy ID → upload logo → cập nhật lại logo.
     *
     * $data từ StoreClubRequest::validated():
     *   logo        → UploadedFile|null
     *   is_active   → bool
     *   sort_order  → int|null
     *   max_members → int|null
     *   translations → ['vi' => ['name' => ..., 'description' => ...], 'en' => [...]]
     */
    public function create(array $data): Club
    {
        // Tách logo ra — chưa upload vì chưa có ID
        $logoFile = $data['logo'] ?? null;
        unset($data['logo']);

        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        if (!isset($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        } else {
            $this->repository->applySortOrder((int) $data['sort_order']);
        }

        // Tạo club (chưa có logo)
        $club = $this->repository->createWithTranslations($data, $translations);

        // Upload logo sau khi có ID → /uploads/clubs/{id}/logo/file.webp
        if ($logoFile) {
            $logo = ImageHelper::uploadSingle(
                file: $logoFile,
                folder: "clubs/{$club->id}/logo",
            );
            $club->update(['logo' => $logo]);
            $club->logo = $logo;
        }

        return $club->load('translations');
    }

    /**
     * Cập nhật club kèm translations (upsert theo locale).
     *
     * Logo:
     *   - Có UploadedFile mới  → upload vào /uploads/clubs/{id}/logo/, xóa ảnh cũ
     *   - Không gửi file       → giữ nguyên logo trong DB (unset key, không set null)
     */
    public function update(int $id, array $data): Club
    {
        $club = $this->find($id);

        // Xử lý logo
        if (!empty($data['logo'])) {
            $data['logo'] = ImageHelper::uploadSingle(
                file: $data['logo'],
                folder: "clubs/{$club->id}/logo",
                oldFile: $club->logo,
            );
        } else {
            // Không gửi file → bỏ key, giữ nguyên giá trị DB
            unset($data['logo']);
        }

        $translations = $data['translations'] ?? [];
        unset($data['translations']);

        if (isset($data['sort_order']) && (int) $data['sort_order'] !== (int) $club->sort_order) {
            $this->repository->applySortOrder((int) $data['sort_order'], $club->id, $club->sort_order);
        }

        return $this->repository->updateWithTranslations($club, $data, $translations);
    }

    /**
     * Xóa club, đồng thời xóa toàn bộ thư mục ảnh /uploads/clubs/{id}/.
     */
    public function delete(int $id): bool
    {
        $club   = $this->find($id);
        $clubId = $club->id;

        $result = $this->deleteWithSortOrder($id);

        // Xóa cả folder clubs/{id} thay vì chỉ xóa từng file
        if ($result) {
            ImageHelper::deleteFolder("clubs/{$clubId}");
        }

        return $result;
    }

    public function toggleStatus(int $id): Club
    {
        $club            = $this->find($id);
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

    public function updateOwner(int $clubId, int $newOwnerId): Club
    {
        $club = $this->find($clubId);

        return $this->repository->updateOwner($club, $newOwnerId);
    }
}

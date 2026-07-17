<?php

namespace App\Domains\Club\Services;

use App\Base\BaseService;
use App\Domains\Club\Models\Club;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\User\Models\User;
use App\Exceptions\ApiException;
use App\Helpers\ImageHelper;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ClubService extends BaseService
{
    protected string $notFoundMessage = 'domains/club.not_found';
    protected object $repository;

    public function __construct(ClubRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List — override BaseService::paginate vì có phân quyền admin vs user
    // -------------------------------------------------------------------------

    /**
     * Superadmin/Admin → tất cả clubs (getList từ Base).
     * Owner/Manager/Member → chỉ clubs mình được approved (getByUser).
     *
     * cursorPaginate() và getForSelect() không cần override —
     * Base delegate thẳng xuống getCursorList() / getForSelect() của Repository.
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    /**
     * Dùng ở ClubController::index — phân quyền theo user.
     */
    public function index(User $user, array $filters): LengthAwarePaginator
    {
        if ($user->isSuperAdmin() || $user->isSystemAdmin()) {
            return $this->repository->getList($filters);
        }

        return $this->repository->getByUser($user->id, $filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    /**
     * Tìm club theo ID, eager load translations. Throw 404 nếu không tìm thấy.
     */
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

    /**
     * Tìm club theo slug trong bảng translations, chỉ trả về club đang active.
     */
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
     *   logo         → UploadedFile|null
     *   is_active    → bool
     *   sort_order   → int|null
     *   max_members  → int|null
     *   translations → ['vi' => ['name' => ..., 'description' => ...], 'en' => [...]]
     */
    public function create(array $data): Club
    {
        return DB::transaction(function () use ($data) {
            $logoFile = $data['logo'] ?? null;
            unset($data['logo']);

            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            if (!isset($data['sort_order'])) {
                $data['sort_order'] = $this->repository->getNextSortOrder();
            } else {
                $this->repository->applySortOrder((int) $data['sort_order']);
            }

            $club = $this->repository->createWithTranslations($data, $translations);

            if ($logoFile) {
                $logo = ImageHelper::uploadSingle(
                    file: $logoFile,
                    folder: "clubs/{$club->id}/logo",
                );

                $club->update([
                    'logo' => $logo,
                ]);

                $club->logo = $logo;
            }

            return $club->load('translations');
        });
    }

    /**
     * Cập nhật club kèm translations (upsert theo locale).
     *
     * Logo:
     *   - Có UploadedFile mới  → upload, xóa ảnh cũ
     *   - Không gửi file       → giữ nguyên logo trong DB
     */
    public function update(int $id, array $data): Club
    {
        return DB::transaction(function () use ($id, $data) {
            $club = $this->find($id);

            if (!empty($data['logo'])) {
                $data['logo'] = ImageHelper::uploadSingle(
                    file: $data['logo'],
                    folder: "clubs/{$club->id}/logo",
                    oldFile: $club->logo,
                );
            } else {
                unset($data['logo']);
            }

            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            if (
                isset($data['sort_order']) &&
                (int) $data['sort_order'] !== (int) $club->sort_order
            ) {
                $this->repository->applySortOrder(
                    (int) $data['sort_order'],
                    $club->id,
                    $club->sort_order
                );
            }

            return $this->repository->updateWithTranslations(
                $club,
                $data,
                $translations
            );
        });
    }

    /**
     * Xóa club + dồn sort_order + xóa toàn bộ folder ảnh.
     */
    public function delete(int $id): bool
    {
        return DB::transaction(function () use ($id) {
            $club = parent::find($id);

            $result = $this->deleteWithSortOrder($id);

            if ($result) {
                ImageHelper::deleteFolder("clubs/{$club->id}");
            }

            return $result;
        });
    }

    /**
     * Toggle is_active, trả về club kèm translations.
     */
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

    /**
     * Superadmin gán owner mới cho club.
     */
    public function updateOwner(int $clubId, int $newOwnerId): Club
    {
        $club = $this->find($clubId);

        return $this->repository->updateOwner($club, $newOwnerId);
    }
}

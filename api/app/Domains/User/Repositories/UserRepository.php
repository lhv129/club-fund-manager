<?php

namespace App\Domains\User\Repositories;

use App\Base\BaseRepository;
use App\Domains\User\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Builder;

class UserRepository extends BaseRepository
{
    // ------------------------------------------------------------------
    // Cấu hình — Base sử dụng trực tiếp
    // ------------------------------------------------------------------

    protected string $defaultOrderBy        = 'id';
    protected string $defaultOrderDirection = 'desc';

    /** Whitelist cột sort cho getList() */
    protected array $allowedSortColumns = ['id', 'fullname', 'email', 'created_at'];

    /** Cột cho getForSelect() — trả [{id, fullname}] */
    protected array $selectColumns = ['id', 'fullname'];

    public function __construct(User $model)
    {
        parent::__construct($model);
    }

    // ------------------------------------------------------------------
    // Hook overrides
    // ------------------------------------------------------------------

    /**
     * Search theo fullname hoặc email.
     */
    protected function applySearch(Builder $query, array $filters): void
    {
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($q) use ($search) {
                $q->where('fullname', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }
    }

    /**
     * Filter đặc thù User: status (string) + email_verified_at (0|1).
     * Thêm filter mới vào đây — getList / getCursorList / getForSelect tự áp dụng.
     */
    protected function applyFilters(Builder $query, array $filters): void
    {
        $this->applyStatusFilter($query, $filters, 'status', ['active', 'inactive', 'locked']);

        if (
            isset($filters['email_verified_at'])
            && $filters['email_verified_at'] !== ''
            && $filters['email_verified_at'] !== null
        ) {
            $verified = filter_var($filters['email_verified_at'], FILTER_VALIDATE_BOOLEAN);
            $verified
                ? $query->whereNotNull('email_verified_at')
                : $query->whereNull('email_verified_at');
        }
    }

    /**
     * Query cơ sở cho getList() / getCursorList().
     * User không cần withCount — chỉ select cột cần thiết.
     */
    protected function baseListQuery(): Builder
    {
        return $this->model->select(['id', 'fullname', 'email', 'status', 'email_verified_at', 'created_at']);
    }

    // ------------------------------------------------------------------
    // Domain-specific list methods
    // ------------------------------------------------------------------

    /**
     * Danh sách user active + đã verify email (hardcoded business rule).
     * Không dùng getList() vì điều kiện là business rule, không phải filter tùy chọn.
     */
    public function paginateActive(array $filters = []): LengthAwarePaginator
    {
        $query = $this->baseListQuery()
            ->where('status', 'active')
            ->whereNotNull('email_verified_at');

        $this->applySearch($query, $filters);
        $this->applySorting($query, $filters, $this->allowedSortColumns);

        return $query->paginate(
            $filters['limit'] ?? $this->defaultLimit,
            ['*'],
            'page',
            $filters['page'] ?? 1
        );
    }

    // ------------------------------------------------------------------
    // Ad-hoc lookups
    // ------------------------------------------------------------------

    public function findByEmail(string $email): ?User
    {
        return $this->model->where('email', $email)->first();
    }

    public function findByEmailOrUsername(string $login): ?User
    {
        return $this->model
            ->where('email', $login)
            ->orWhere('username', $login)
            ->first();
    }

    // ------------------------------------------------------------------
    // Write helpers
    // ------------------------------------------------------------------

    /**
     * Bulk lock nhiều user theo danh sách id.
     */
    public function deactivateMany(array $ids): int
    {
        if (empty($ids)) {
            return 0;
        }

        return $this->model->newQuery()
            ->whereIn('id', $ids)
            ->update(['status' => 'locked']);
    }
}

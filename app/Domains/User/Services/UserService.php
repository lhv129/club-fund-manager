<?php

namespace App\Domains\User\Services;

use App\Base\BaseService;
use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class UserService extends BaseService
{
    protected string $notFoundMessage = 'domains/user.not_found';
    protected object $repository;

    public function __construct(UserRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * GET /api/v1/users
     *
     * Params:
     *   status             string   active|inactive|locked
     *   email_verified_at  0|1      lọc theo đã verify hay chưa
     *   search             string   tìm theo name hoặc email
     *   sort_by            string   cột sort
     *   sort_dir           string   asc|desc
     *   limit              int
     *   page               int
     */
    public function paginate(array $params = []): LengthAwarePaginator
    {
        $where = $this->buildWhere($params, ['status']);

        if (isset($params['email_verified_at'])) {
            $where['email_verified_at'] = $params['email_verified_at']
                ? ['email_verified_at', 'whereNotNull', null]
                : ['email_verified_at', 'whereNull',    null];
        }

        $where = array_merge(
            $where,
            $this->buildSearchWhere($params, ['fullname', 'email']),
        );

        return $this->repository->paginate(
            where: $where,
            orderBy: $this->buildOrderBy($params),
            select: ['id', 'fullname', 'email', 'created_at'],
            limit: (int) ($params['limit'] ?? 0),
            page: (int) ($params['page']  ?? 0),
        );
    }

    /**
     * GET /api/v1/users/active — chỉ trả active + đã verify email (hardcoded)
     */
    public function paginateActive(array $params = []): LengthAwarePaginator
    {
        $where = array_merge(
            [
                'status' => 'active',
                'email_verified_at' => ['email_verified_at', 'whereNotNull', null],
            ],
            $this->buildSearchWhere($params, ['fullname', 'email']),
        );

        return $this->repository->paginate(
            where: $where,
            orderBy: $this->buildOrderBy($params),
            select: ['id', 'fullname', 'email', 'created_at'],
            limit: (int) ($params['limit'] ?? 0),
            page: (int) ($params['page']  ?? 0),
        );
    }

    /**
     * GET /api/v1/users/cursor
     *
     * FIX: thêm filterKeys và search vào where
     */
    public function cursorPaginate(array $params = []): \Illuminate\Contracts\Pagination\CursorPaginator
    {
        $where = array_merge(
            $this->buildWhere($params, ['status']),
            $this->buildSearchWhere($params, ['fullname', 'email']),
        );

        return $this->repository->cursorPaginate(
            where: $where,
            orderBy: ['id' => 'desc'],
            select: ['id', 'fullname', 'email', 'created_at'],
            limit: (int) ($params['limit'] ?? 0),
        );
    }

    /**
     * GET /api/v1/users/select?search=nguyen&status=active
     *
     * Response: [{"id": 15, "fullname": "Nguyễn Văn A"}, ...]
     */
    public function getForSelect(array $params = []): Collection
    {
        $where = array_merge(
            $this->buildWhere($params, ['status']),
            $this->buildSearchWhere($params, ['fullname', 'email']),
        );

        return $this->repository->get(
            where: $where,
            orderBy: ['id' => 'asc'],
            select: ['id', 'fullname'],
            limit: min((int) ($params['limit'] ?? 20), 50),
        );
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): User
    {
        return parent::find($id);
    }

    /**
     * FIX: where dùng đúng format ['id' => $id] thay vì [['id','=',$id]]
     */
    public function findWithRelations(int $id, array $with = []): User
    {
        $user = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$user) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $user;
    }

    public function findByEmail(string $email): ?User
    {
        return $this->repository->findByEmail($email);
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(array $data): User
    {
        $data['password'] = Hash::make($data['password']);
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        }
        return parent::update($id, $data);
    }

    /**
     * Override vì User dùng status string thay vì is_active boolean
     */
    public function toggleStatus(int $id): User
    {
        $user = $this->find($id);

        $user->status = $user->status === 'active' ? 'locked' : 'active';
        $user->save();

        return $user->fresh();
    }

    public function deactivateMany(array $ids): int
    {
        return $this->repository->editWhere(
            where: ['id' => ['id', 'whereIn', $ids]],
            data: ['status' => 'locked'],
        );
    }

    /**
     * FIX: thêm filterKeys + search để count đúng
     */
    public function count(array $params = []): int
    {
        $where = array_merge(
            $this->buildWhere($params, ['status']),
            $this->buildSearchWhere($params, ['fullname', 'email']),
        );

        return $this->repository->count($where);
    }
}

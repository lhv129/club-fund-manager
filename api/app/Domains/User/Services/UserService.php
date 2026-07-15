<?php

namespace App\Domains\User\Services;

use App\Base\BaseService;
use App\Domains\User\Models\User;
use App\Domains\User\Repositories\UserRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
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
     * Params: search, status, email_verified_at, sort_by, sort_dir, limit, page
     */
    public function paginate(array $params = []): LengthAwarePaginator
    {
        return $this->repository->paginate($params);
    }

    /**
     * GET /api/v1/users/active — chỉ trả active + đã verify email (hardcoded)
     */
    public function paginateActive(array $params = []): LengthAwarePaginator
    {
        return $this->repository->paginateActive($params);
    }

    /**
     * GET /api/v1/users/cursor
     */
    public function cursorPaginate(array $params = []): CursorPaginator
    {
        return $this->repository->cursorPaginate($params);
    }

    /**
     * GET /api/v1/users/select?search=nguyen&status=active
     */
    public function getForSelect(array $params = []): Collection
    {
        return $this->repository->getForSelect($params);
    }

    /**
     * Đếm user theo filter — dùng cho badge / thống kê.
     */
    public function count(array $params = []): int
    {
        return $this->repository->countFiltered($params);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): User
    {
        return parent::find($id);
    }

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
        return $this->repository->deactivateMany($ids);
    }
}

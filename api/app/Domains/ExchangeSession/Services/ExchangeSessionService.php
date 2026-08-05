<?php

namespace App\Domains\ExchangeSession\Services;

use App\Base\BaseService;
use App\Domains\ExchangeSession\Models\ExchangeSession;
use App\Domains\ExchangeSession\Repositories\ExchangeSessionRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class ExchangeSessionService extends BaseService
{
    protected string $notFoundMessage = 'domains/exchange_session.not_found';

    public function __construct(ExchangeSessionRepository $repository)
    {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    public function cursorPaginate(array $filters = []): CursorPaginator
    {
        return $this->repository->getCursorList($filters);
    }

    public function getForSelect(array $filters = []): Collection
    {
        return $this->repository->getForSelect($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): ExchangeSession
    {
        return parent::find($id);
    }

    public function findWithRelations(int $id, array $with = []): ExchangeSession
    {
        $session = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$session) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $session;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(array $data): ExchangeSession
    {
        return DB::transaction(function () use ($data) {
            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            if (!isset($data['sort_order'])) {
                $data['sort_order'] = $this->repository->getNextSortOrder();
            }

            $session = $this->repository->createWithTranslations($data, $translations);

            // Cập nhật player_count từ số player thực tế (nếu cần)
            $this->syncPlayerCount($session);

            return $session;
        });
    }

    public function update(int $id, array $data): ExchangeSession
    {
        return DB::transaction(function () use ($id, $data) {
            $session = $this->find($id);

            $translations = $data['translations'] ?? [];
            unset($data['translations']);

            $session = $this->repository->updateWithTranslations(
                $session,
                $data,
                $translations
            );

            $this->syncPlayerCount($session);

            return $session;
        });
    }

    public function toggleStatus(int $id): ExchangeSession
    {
        $session             = $this->find($id);
        $session->is_active   = !$session->is_active;
        $session->save();

        return $session->fresh('translations');
    }

    public function reorder(array $data): bool
    {
        DB::beginTransaction();

        try {
            foreach ($data as $item) {
                $this->repository->editWhere(
                    where: ['id' => $item['id']],
                    data: ['sort_order' => $item['sort_order']],
                );
            }

            DB::commit();
            return true;
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Đồng bộ player_count + total_amount + amount_per_player từ danh sách player.
     * Gọi sau khi thêm/sửa/xoá player trong ExchangeSessionPlayerService.
     */
    public function recalculateTotals(int $sessionId): void
    {
        $session = $this->find($sessionId);

        $players = $session->players()->where('is_active', true)->get();

        $playerCount = $players->count();
        $totalAmount = (float) $players->sum('amount');
        $amountPerPlayer = $playerCount > 0
            ? round($totalAmount / $playerCount, 2)
            : 0;

        $this->repository->editWhere(
            where: ['id' => $sessionId],
            data: [
                'player_count'      => $playerCount,
                'total_amount'      => $totalAmount,
                'amount_per_player' => $amountPerPlayer,
            ],
        );
    }

    private function syncPlayerCount(ExchangeSession $session): void
    {
        // Khi tạo mới, chưa có player → giữ nguyên giá trị truyền vào (mặc định 0)
        // Khi update, không tự đếm lại để tránh đè giá trị admin set tay.
        // Việc tính lại qua recalculateTotals() khi thao tác player.
    }
}

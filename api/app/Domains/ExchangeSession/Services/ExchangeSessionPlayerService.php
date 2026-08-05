<?php

namespace App\Domains\ExchangeSession\Services;

use App\Base\BaseService;
use App\Domains\ExchangeSession\Models\ExchangeSessionPlayer;
use App\Domains\ExchangeSession\Repositories\ExchangeSessionPlayerRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class ExchangeSessionPlayerService extends BaseService
{
    protected string $notFoundMessage = 'domains/exchange_session.player_not_found';

    public function __construct(
        ExchangeSessionPlayerRepository $repository,
        protected ExchangeSessionService $sessionService,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List
    // -------------------------------------------------------------------------

    /**
     * Danh sách player của 1 session, phân trang offset.
     */
    public function paginate(int $sessionId, array $filters = []): LengthAwarePaginator
    {
        $filters['exchange_session_id'] = $sessionId;

        return $this->repository->getList($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): ExchangeSessionPlayer
    {
        return parent::find($id);
    }

    public function findBySession(int $sessionId, int $playerId): ExchangeSessionPlayer
    {
        $player = $this->repository->first(
            where: ['id' => $playerId, 'exchange_session_id' => $sessionId],
            with: ['user:id,fullname'],
            select: ['*'],
        );

        if (!$player) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $player;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(int $sessionId, array $data): ExchangeSessionPlayer
    {
        return DB::transaction(function () use ($sessionId, $data) {
            // Verify session tồn tại (throw 404 nếu không)
            $this->sessionService->find($sessionId);

            $data['exchange_session_id'] = $sessionId;

            if (!isset($data['sort_order'])) {
                $data['sort_order'] = $this->repository->getNextSortOrder();
            }

            $player = $this->repository->create($data);

            // Tính lại tổng số tiền / số player của session
            $this->sessionService->recalculateTotals($sessionId);

            return $player->load('user:id,fullname');
        });
    }

    public function update(int $sessionId, int $playerId, array $data): ExchangeSessionPlayer
    {
        return DB::transaction(function () use ($sessionId, $playerId, $data) {
            $player = $this->findBySession($sessionId, $playerId);

            $player = $this->repository->update($player, $data);

            $this->sessionService->recalculateTotals($sessionId);

            return $player->load('user:id,fullname');
        });
    }

    public function delete(int $sessionId, int $playerId): bool
    {
        return DB::transaction(function () use ($sessionId, $playerId) {
            $player = $this->findBySession($sessionId, $playerId);

            $this->repository->delete($player);

            $this->sessionService->recalculateTotals($sessionId);

            return true;
        });
    }

    /**
     * Đánh dấu đã thanh toán / chưa thanh toán.
     */
    public function togglePaid(int $sessionId, int $playerId): ExchangeSessionPlayer
    {
        return DB::transaction(function () use ($sessionId, $playerId) {
            $player       = $this->findBySession($sessionId, $playerId);
            $player->paid = !$player->paid;
            $player->save();

            $this->sessionService->recalculateTotals($sessionId);

            return $player->fresh('user:id,fullname');
        });
    }

    /**
     * Đánh dấu check-in / hủy check-in.
     */
    public function toggleCheckIn(int $sessionId, int $playerId): ExchangeSessionPlayer
    {
        return DB::transaction(function () use ($sessionId, $playerId) {
            $player                = $this->findBySession($sessionId, $playerId);
            $player->checked_in    = !$player->checked_in;
            $player->save();

            return $player->fresh('user:id,fullname');
        });
    }
}

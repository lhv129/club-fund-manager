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
     * (Đặt tên khác paginate() để tránh xung đột signature với BaseService::paginate().)
     */
    public function paginateForSession(int $sessionId, array $filters = []): LengthAwarePaginator
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
    // Method đặt tên *ForSession / *FromSession để tránh xung đột signature
    // với BaseService::create / update / delete (parent nhận (array | int, array)).

    public function createForSession(int $sessionId, array $data): ExchangeSessionPlayer
    {
        return DB::transaction(function () use ($sessionId, $data) {
            $session = $this->sessionService->find($sessionId);

            $data['exchange_session_id'] = $sessionId;

            // Tự tính amount = male×exchange_male_amount + female×exchange_female_amount
            // (lấy từ session đã snapshot, hoặc 0 nếu chưa chốt)
            $male   = (int) ($data['male']   ?? 0);
            $female = (int) ($data['female'] ?? 0);
            $data['amount'] = round(
                ($male * (float) $session->exchange_male_amount)
                + ($female * (float) $session->exchange_female_amount),
                2,
            );

            if (!isset($data['sort_order'])) {
                $data['sort_order'] = $this->repository->getNextSortOrder();
            }

            $player = $this->repository->create($data);

            // Tính lại tổng của session (sẽ tự recompute amount nếu có FundPeriod)
            $this->sessionService->recalculateTotals($sessionId);

            return $player->load('user:id,fullname');
        });
    }

    public function updateForSession(int $sessionId, int $playerId, array $data): ExchangeSessionPlayer
    {
        return DB::transaction(function () use ($sessionId, $playerId, $data) {
            $player = $this->findBySession($sessionId, $playerId);
            $session = $this->sessionService->find($sessionId);

            // Nếu đổi male/female mà không gửi amount → tự tính lại
            if ((isset($data['male']) || isset($data['female'])) && !isset($data['amount'])) {
                $male   = (int) ($data['male']   ?? $player->male);
                $female = (int) ($data['female'] ?? $player->female);
                $data['amount'] = round(
                    ($male * (float) $session->exchange_male_amount)
                    + ($female * (float) $session->exchange_female_amount),
                    2,
                );
            }

            // Gắn transaction_id → tự set paid=1 (đối soát tay)
            if (!empty($data['transaction_id']) && $player->transaction_id !== (int) $data['transaction_id']) {
                $data['paid'] = true;
            }

            $player = $this->repository->update($player, $data);

            $this->sessionService->recalculateTotals($sessionId);

            return $player->load('user:id,fullname', 'transaction:id,source,type,amount,description,transaction_date');
        });
    }

    public function deleteFromSession(int $sessionId, int $playerId): bool
    {
        return DB::transaction(function () use ($sessionId, $playerId) {
            $player = $this->findBySession($sessionId, $playerId);

            $this->repository->delete($player);

            $this->sessionService->recalculateTotals($sessionId);

            return true;
        });
    }

    /**
     * Đánh dấu đã thanh toán / chưa thanh toán (toggle tay).
     */
    public function togglePaid(int $sessionId, int $playerId): ExchangeSessionPlayer
    {
        return DB::transaction(function () use ($sessionId, $playerId) {
            $player       = $this->findBySession($sessionId, $playerId);
            $player->paid = !$player->paid;
            // Khi unset paid → xoá link transaction_id (không đối soát nữa)
            if (!$player->paid) {
                $player->transaction_id = null;
            }
            $player->save();

            return $player->fresh(['user:id,fullname', 'transaction:id,source,type,amount,description,transaction_date']);
        });
    }

}

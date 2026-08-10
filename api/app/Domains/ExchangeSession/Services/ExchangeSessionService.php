<?php

namespace App\Domains\ExchangeSession\Services;

use App\Base\BaseService;
use App\Domains\ExchangeSession\Models\ExchangeSession;
use App\Domains\ExchangeSession\Repositories\ExchangeSessionRepository;
use App\Domains\FundPeriod\Repositories\FundPeriodRepository;
use App\Exceptions\ApiException;
use Carbon\Carbon;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ExchangeSessionService extends BaseService
{
    protected string $notFoundMessage = 'domains/exchange_session.not_found';

    public function __construct(
        ExchangeSessionRepository $repository,
        protected FundPeriodRepository $fundPeriodRepository,
    ) {
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

        if (! $session) {
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

            if (! isset($data['sort_order'])) {
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
        $session = $this->find($id);
        $session->is_active = ! $session->is_active;
        $session->save();

        return $session->fresh('translations');
    }

    /**
     * Đồng bộ player_count + total_amount + amount_per_player từ danh sách
     * các nhóm giao lưu (exchange_session_players) + đơn giá FundPeriod của
     * tháng session_date.
     *
     * Luồng:
     *   1. Tìm FundPeriod theo club_id + (year, month) của session_date.
     *      - Nếu CÓ FundPeriod → snapshot exchange_male_amount / exchange_female_amount
     *        lên session, tính lại amount mỗi nhóm giao lưu từ rates, rồi tổng
     *        total_amount = sum(amount). player_count = sum(male + female).
     *      - Nếu KHÔNG có FundPeriod → chỉ đếm player_count = sum(male+female),
     *        để total_amount nguyên, KHÔNG throw (cho phép thêm/xoá player trước
     *        khi tạo FundPeriod). Throw chỉ xảy ra ở complete().
     *   2. amount_per_player = total_amount / max(player_count, 1) (trung bình).
     *
     * Gọi sau khi thêm/sửa/xoá player trong ExchangeSessionPlayerService.
     */
    public function recalculateTotals(int $sessionId): void
    {
        $session = $this->find($sessionId);

        $players = $session->players()->where('is_active', true)->get();

        $playerCount = (int) $players->sum(fn ($p) => (int) $p->male + (int) $p->female);

        $data = [
            'player_count' => $playerCount,
        ];

        $fundPeriod = $this->fundPeriodRepository->findByClubAndDate(
            (int) $session->club_id,
            (int) Carbon::parse($session->session_date)->year,
            (int) Carbon::parse($session->session_date)->month,
        );

        if ($fundPeriod) {
            $exchangeMale = (float) $fundPeriod->exchange_male_amount;
            $exchangeFemale = (float) $fundPeriod->exchange_female_amount;

            $data['exchange_male_amount'] = $exchangeMale;
            $data['exchange_female_amount'] = $exchangeFemale;

            // Tính lại amount mỗi nhóm giao lưu từ rates + tổng total_amount
            $totalAmount = 0;
            foreach ($players as $player) {
                $rowAmount = ((int) $player->male * $exchangeMale)
                    + ((int) $player->female * $exchangeFemale);
                $player->amount = round($rowAmount, 2);
                $player->save();
                $totalAmount += $rowAmount;
            }

            $data['total_amount'] = round($totalAmount, 2);
            $data['amount_per_player'] = $playerCount > 0
                ? round($totalAmount / $playerCount, 2)
                : 0;
        } else {
            // Không có FundPeriod → total = sum(amount) hiện có (thường 0)
            $data['total_amount'] = round((float) $players->sum('amount'), 2);
            $data['amount_per_player'] = $playerCount > 0
                ? round((float) $players->sum('amount') / $playerCount, 2)
                : 0;
        }

        $this->repository->editWhere(
            where: ['id' => $sessionId],
            data: $data,
        );
    }

    /**
     * Chốt buổi đánh — status upcoming → completed.
     *
     * Guards:
     *   - status !== 'upcoming' → 422 "buổi đã chốt / đã huỷ".
     *   - chưa có FundPeriod cho tháng session_date → 422 (phải tạo FundPeriod trước).
     *
     * Sau khi recalculate → set status=completed.
     */
    public function complete(int $sessionId): ExchangeSession
    {
        return DB::transaction(function () use ($sessionId) {
            $session = $this->find($sessionId);

            if ($session->status !== 'upcoming') {
                throw new ApiException(
                    __('domains/exchange_session.already_completed'),
                    422,
                );
            }

            $fundPeriod = $this->fundPeriodRepository->findByClubAndDate(
                (int) $session->club_id,
                (int) Carbon::parse($session->session_date)->year,
                (int) Carbon::parse($session->session_date)->month,
            );

            if (! $fundPeriod) {
                throw new ApiException(
                    __('domains/exchange_session.missing_fund_period'),
                    422,
                );
            }

            // Recalculate (có FundPeriod → snapshot đơn giá + tính total)
            $this->recalculateTotals($sessionId);

            $this->repository->update($session, ['status' => 'completed']);

            return $session->fresh(['translations', 'players']);
        });
    }

    /**
     * Chốt tự động các buổi đã qua giờ kết thúc.
     *
     * Mỗi buổi được xử lý độc lập để một bản ghi lỗi (ví dụ thiếu FundPeriod)
     * không làm dừng toàn bộ cron.
     *
     * @return array{completed: int, failed: int}
     */
    public function completeExpiredUpcoming(?int $scheduleId = null): array
    {
        $sessions = $this->repository->getExpiredUpcoming($scheduleId);
        $completed = 0;
        $failed = 0;

        foreach ($sessions as $session) {
            try {
                $this->complete($session->id);
                $completed++;
            } catch (\Throwable $e) {
                $failed++;
                Log::warning('[ExchangeSession] auto-complete failed', [
                    'session_id' => $session->id,
                    'schedule_id' => $session->playing_schedule_id,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return ['completed' => $completed, 'failed' => $failed];
    }

    private function syncPlayerCount(ExchangeSession $session): void
    {
        // Khi tạo mới, chưa có player → giữ nguyên giá trị truyền vào (mặc định 0)
        // Khi update, không tự đếm lại để tránh đè giá trị admin set tay.
        // Việc tính lại qua recalculateTotals() khi thao tác player.
    }
}

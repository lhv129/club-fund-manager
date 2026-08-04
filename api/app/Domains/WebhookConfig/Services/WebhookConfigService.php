<?php

namespace App\Domains\WebhookConfig\Services;

use App\Base\BaseService;
use App\Domains\Club\Repositories\ClubRepository;
use App\Domains\WebhookConfig\Models\WebhookConfig;
use App\Domains\WebhookConfig\Repositories\WebhookConfigRepository;
use App\Exceptions\ApiException;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Str;

class WebhookConfigService extends BaseService
{
    protected string $notFoundMessage = 'domains/webhook_config.not_found';

    public function __construct(
        WebhookConfigRepository $repository,
        protected ClubRepository $clubRepository,
    ) {
        parent::__construct($repository);
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * GET /api/v1/clubs/{clubSlug}/webhook-configs
     *
     * Inject club_id từ clubSlug — business rule, không phải query builder.
     */
    public function paginateWebhookConfigs(string $clubSlug, array $filters = []): LengthAwarePaginator
    {
        $filters['club_id'] = $this->resolveClubId($clubSlug);

        return $this->repository->getList($filters);
    }

    /**
     * GET /api/v1/clubs/{clubSlug}/webhook-configs/cursor
     */
    public function cursorPaginateWebhookConfigs(string $clubSlug, array $filters = []): CursorPaginator
    {
        $filters['club_id'] = $this->resolveClubId($clubSlug);

        return $this->repository->getCursorList($filters);
    }

    /**
     * GET /api/v1/clubs/{clubSlug}/webhook-configs/select — dropdown.
     */
    public function getForSelectWithClubId(string $clubSlug, array $filters = []): Collection
    {
        $filters['club_id'] = $this->resolveClubId($clubSlug);

        return $this->repository->getForSelect($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    public function find($id): WebhookConfig
    {
        return parent::find($id);
    }

    /**
     * Tìm kèm relations.
     */
    public function findWithRelations(int $id, array $with = []): WebhookConfig
    {
        $webhookConfig = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$webhookConfig) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $webhookConfig;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    /**
     * Tạo webhook config cho club.
     * club_id inject từ clubSlug (business rule).
     */
    public function createWebhookConfig(string $clubSlug, array $data): WebhookConfig
    {
        $data['club_id'] = $this->resolveClubId($clubSlug);
        // Tự sinh token ngẫu nhiên 40 ký tự
        $token = Str::random(40);
        $data['webhook_token'] = $token;
        // Tự sinh webhook_url dựa trên token (admin chỉ cần copy)
        $data['webhook_url'] = url("/api/v1/sepay/webhook/{$token}");
        if (empty($data['sort_order'])) {
            $data['sort_order'] = $this->repository->getNextSortOrder();
        }
        return $this->repository->create($data);
    }

    public function update(int $id, array $data): WebhookConfig
    {
        return parent::update($id, $data);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Resolve club_id từ clubSlug.
     * Throw 404 nếu club không tồn tại.
     */
    protected function resolveClubId(string $clubSlug): int
    {
        $club = $this->clubRepository->findByTranslationSlug(
            slug: $clubSlug,
            columns: ['id'],
            conditions: ['is_active' => true],
        );

        if (!$club) {
            throw new ApiException(__('domains/club.not_found'), 404);
        }

        return $club->id;
    }
}

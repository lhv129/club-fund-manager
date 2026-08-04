<?php

namespace App\Domains\BankAccount\Services;

use App\Base\BaseService;
use App\Domains\BankAccount\Models\BankAccount;
use App\Domains\BankAccount\Repositories\BankAccountRepository;
use App\Domains\BankAccount\Services\BankProviderService;
use App\Domains\Club\Repositories\ClubRepository;
use App\Exceptions\ApiException;
use App\Helpers\ImageHelper;
use Illuminate\Contracts\Pagination\CursorPaginator;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class BankAccountService extends BaseService
{
    protected string $notFoundMessage = 'domains/bank_account.not_found';

    protected BankProviderService $bankProviderService;
    protected ClubRepository $clubRepository;
    public function __construct(
        BankAccountRepository $repository,
        BankProviderService $bankProviderService,

        ClubRepository $clubRepository
    ) {
        parent::__construct($repository);
        $this->bankProviderService = $bankProviderService;
        $this->clubRepository = $clubRepository;
    }

    // -------------------------------------------------------------------------
    // List / Search
    // -------------------------------------------------------------------------

    /**
     * GET /api/v1/bank-accounts
     *   ?search=abc &is_active=1 &user_id=2 &sort_by=title &sort_dir=asc &limit=20 &page=1
     */
    public function paginate(array $filters = []): LengthAwarePaginator
    {
        return $this->repository->getList($filters);
    }

    /**
     * GET /api/v1/bank-accounts/cursor — infinite scroll.
     */
    public function cursorPaginate(array $filters = []): CursorPaginator
    {
        return $this->repository->getCursorList($filters);
    }

    /**
     * GET /api/v1/bank-accounts/select — dropdown.
     */
    public function getForSelect(array $filters = []): Collection
    {
        return $this->repository->getForSelect($filters);
    }

    // -------------------------------------------------------------------------
    // Single record
    // -------------------------------------------------------------------------

    /**
     * find() kế thừa từ BaseService — throw 404 với $this->notFoundMessage.
     */
    public function find($id): BankAccount
    {
        return parent::find($id);
    }

    /**
     * Tìm kèm relations.
     */
    public function findWithRelations(int $id, array $with = []): BankAccount
    {
        $bankAccount = $this->repository->first(
            where: ['id' => $id],
            with: $with,
            select: ['*'],
        );

        if (!$bankAccount) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $bankAccount;
    }

    /**
     * Tìm theo slug — throw 404 nếu không có.
     * findBySlug() kế thừa sẵn từ BaseRepository.
     */
    public function findBySlug(string $slug): BankAccount
    {
        $bankAccount = $this->repository->findBySlug($slug);

        if (!$bankAccount) {
            throw new ApiException(__($this->notFoundMessage), 404);
        }

        return $bankAccount;
    }

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(array $data): BankAccount
    {
        DB::beginTransaction();

        $uploadedQr = null;

        try {

            $club = $this->clubRepository->find($data['club_id']);

            $data['bank_code'] = $this->bankProviderService->code($data['bank_name']);

            if (empty($data['sort_order'])) {
                $data['sort_order'] = $this->repository->getNextSortOrder();
            }

            if (
                isset($data['qr_image'])
                && $data['qr_image'] instanceof UploadedFile
            ) {
                $uploadedQr = ImageHelper::uploadSingle(
                    $data['qr_image'],
                    "{$club->storage_key}/bank-accounts"
                );

                $data['qr_image'] = $uploadedQr;
            }

            $bankAccount = $this->repository->create($data);

            DB::commit();

            return $bankAccount;
        } catch (\Throwable $e) {

            DB::rollBack();

            ImageHelper::delete($uploadedQr);

            throw $e;
        }
    }

    public function update(int $id, array $data): BankAccount
    {
        DB::beginTransaction();

        $bankAccount = $this->find($id);

        $club = $this->clubRepository->find($bankAccount->club_id);

        $newQrImage = null;
        $oldQrImage = $bankAccount->qr_image;

        try {

            if (isset($data['bank_name'])) {
                $data['bank_code'] = $this->bankProviderService->code($data['bank_name']);
            }

            if (
                isset($data['qr_image']) &&
                $data['qr_image'] instanceof UploadedFile
            ) {
                $newQrImage = ImageHelper::uploadSingle(
                    $data['qr_image'],
                    "{$club->storage_key}/bank-accounts"
                );

                $data['qr_image'] = $newQrImage;
            }

            /** @var BankAccount $bankAccount */
            $bankAccount = parent::update($id, $data);

            DB::commit();

            // Chỉ xóa ảnh cũ sau khi DB update thành công
            if ($newQrImage && $oldQrImage) {
                ImageHelper::delete($oldQrImage);
            }

            return $bankAccount;
        } catch (\Throwable $e) {

            DB::rollBack();

            // Xóa ảnh mới nếu DB lỗi
            if ($newQrImage) {
                ImageHelper::delete($newQrImage);
            }

            throw $e;
        }
    }

    /**
     * Reorder khi kéo thả.
     *
     * $data = [['id' => 1, 'sort_order' => 2], ['id' => 2, 'sort_order' => 1]]
     */
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
}

<?php

namespace App\Domains\Bank\Services;

use App\Base\BaseService;
use App\Domains\Bank\Models\BankAccount;
use App\Domains\Bank\Repositories\BankAccountRepository;
use App\Domains\Bank\Services\BankProviderService;
use App\Domains\Club\Repositories\ClubRepository;
use App\Exceptions\ApiException;
use App\Helpers\ImageHelper;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
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

    // -------------------------------------------------------------------------
    // Write
    // -------------------------------------------------------------------------

    public function create(array $data): BankAccount
    {
        DB::beginTransaction();

        $uploadedQr = null;

        try {
            $club = $this->clubRepository->find(
                (int) $data['club_id']
            );

            /*
        |--------------------------------------------------------------------------
        | Check duplicate bank account
        |--------------------------------------------------------------------------
        |
        | Một tài khoản ngân hàng chỉ được tồn tại 1 lần trên toàn hệ thống.
        | Không được:
        | - Một club thêm cùng tài khoản 2 lần
        | - Hai club khác nhau cùng gắn một tài khoản
        |
        */
            if ($this->repository->existsByBankAccount(
                (int) $data['bank_id'],
                $data['account_number'],
            )) {
                throw new ApiException(
                    __('domains/bank_account.already_exists'),
                    422
                );
            }

            $data['is_active'] = $data['is_active'] ?? true;

            if (empty($data['sort_order'])) {
                $data['sort_order'] = $this->repository->getNextSortOrder();
            }

            /*
        |--------------------------------------------------------------------------
        | Default account
        |--------------------------------------------------------------------------
        */
            if (!empty($data['is_default'])) {
                $this->repository->clearDefault(
                    (int) $data['club_id']
                );
            }

            /*
        |--------------------------------------------------------------------------
        | Upload QR
        |--------------------------------------------------------------------------
        */
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

            /*
        |--------------------------------------------------------------------------
        | Create
        |--------------------------------------------------------------------------
        */
            $bankAccount = $this->repository->create($data);

            DB::commit();

            return $bankAccount;
        } catch (\Throwable $e) {
            DB::rollBack();

            /*
        | Nếu DB create lỗi sau khi upload QR
        | thì xoá file vừa upload.
        */
            if ($uploadedQr) {
                ImageHelper::delete($uploadedQr);
            }

            throw $e;
        }
    }

    public function update(int $id, array $data): BankAccount
    {
        DB::beginTransaction();

        $newQrImage = null;

        try {
            /** @var BankAccount $bankAccount */
            $bankAccount = $this->find($id);

            /*
        |--------------------------------------------------------------------------
        | Club của account hiện tại
        |--------------------------------------------------------------------------
        |
        | Không lấy $data['club'].
        | BankAccount đã thuộc club nào thì lấy club đó.
        |
        */
            $club = $this->clubRepository->find(
                (int) $bankAccount->club_id
            );

            $oldQrImage = $bankAccount->qr_image;

            /*
        |--------------------------------------------------------------------------
        | Check duplicate bank account
        |--------------------------------------------------------------------------
        |
        | Exclude chính account đang update bằng $id.
        |
        */
            if (
                $this->repository->existsByBankAccount(
                    (int) $data['bank_id'],
                    $data['account_number'],
                    $id,
                )
            ) {
                throw new ApiException(
                    __('domains/bank_account.already_exists'),
                    422
                );
            }

            /*
        |--------------------------------------------------------------------------
        | Default account
        |--------------------------------------------------------------------------
        |
        | Nếu account này được set default,
        | clear default của các account khác trong cùng club.
        |
        */
            if (!empty($data['is_default'])) {
                $this->repository->clearDefault(
                    (int) $bankAccount->club_id
                );
            }

            /*
        |--------------------------------------------------------------------------
        | Upload QR mới
        |--------------------------------------------------------------------------
        */
            if (
                isset($data['qr_image'])
                && $data['qr_image'] instanceof UploadedFile
            ) {
                $newQrImage = ImageHelper::uploadSingle(
                    $data['qr_image'],
                    "{$club->storage_key}/bank-accounts"
                );

                $data['qr_image'] = $newQrImage;
            }

            /*
        |--------------------------------------------------------------------------
        | Không cho update club_id
        |--------------------------------------------------------------------------
        |
        | Một BankAccount đã thuộc club nào thì giữ nguyên club đó.
        |
        */
            unset($data['club_id']);

        /*
        |--------------------------------------------------------------------------
        | Update
        |--------------------------------------------------------------------------
        */
            /** @var BankAccount $bankAccount */
            $bankAccount = parent::update(
                $id,
                $data
            );

            DB::commit();

            /*
        |--------------------------------------------------------------------------
        | Delete old QR
        |--------------------------------------------------------------------------
        |
        | Chỉ xoá ảnh cũ sau khi DB update thành công.
        |
        */
            if ($newQrImage && $oldQrImage) {
                ImageHelper::delete($oldQrImage);
            }

            return $bankAccount;
        } catch (\Throwable $e) {
            DB::rollBack();

            /*
        |--------------------------------------------------------------------------
        | Delete new QR if DB update failed
        |--------------------------------------------------------------------------
        */
            if ($newQrImage) {
                ImageHelper::delete($newQrImage);
            }

            throw $e;
        }
    }

    public function toggleDefault(int $id): BankAccount
    {
        DB::beginTransaction();

        try {

            /** @var BankAccount $bankAccount */
            $bankAccount = $this->find($id);

            // Nếu đang là default thì không làm gì
            if ($bankAccount->is_default) {
                DB::commit();
                return $bankAccount;
            }

            // Bỏ default của các tài khoản khác trong cùng club
            $this->repository->clearDefault($bankAccount->club_id);

            // Set default cho tài khoản hiện tại
            $bankAccount = parent::update($id, [
                'is_default' => true,
            ]);

            $bankAccount->fresh();

            DB::commit();

            return $bankAccount;
        } catch (\Throwable $e) {

            DB::rollBack();

            throw $e;
        }
    }
}

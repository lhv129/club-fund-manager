<?php

namespace App\Domains\Auth\Services;

use App\Base\BaseService;
use App\Domains\User\Repositories\UserRepository;
use App\Helpers\ImageHelper;
use App\Helpers\UserNameHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class RegisterService extends BaseService
{

    protected object $emailVerificationTokenService;
    protected object $userRepository;

    public function __construct(
        UserRepository $userRepository,
        // EmailVerificationTokenService $emailVerificationTokenService
    ) {
        $this->userRepository = $userRepository;
        // $this->emailVerificationTokenService = $emailVerificationTokenService;
    }

    public function register(array $data, $avatar = null, $bgImage = null): array
    {
        $uploadedAvatar  = null;
        $uploadedBgImage = null;

        try {
            DB::beginTransaction();

            $data['fullname'] = trim($data['last_name'] . ' ' . $data['first_name']);
            $data['password'] = Hash::make($data['password']);
            $data['status'] = 'inactive';
            $data['email_verified_at'] = null;
            $userName = UserNameHelper::generateGuestUserName();
            $data['username'] = $userName;
            $data['date_of_birth'] = now()->format('Y/m/d');

            if ($avatar) {
                $uploadedAvatar = ImageHelper::uploadSingle($avatar, 'avatars');
                $data['avatar'] = $uploadedAvatar;
            }

            if ($bgImage) {
                $uploadedBgImage  = ImageHelper::uploadSingle($bgImage, 'bg_images');
                $data['bg_image'] = $uploadedBgImage;
            }

            $user = $this->userRepository->create($data);

            // Tạo token xác minh email với thời hạn 1 ngày
            // $token = $this->emailVerificationTokenService->createToken($user->id, 1440);

            DB::commit();

            // Gửi email sau khi commit thành công
            // Mail::to($user->email)->send(new VerifyEmailMail($user, $token));

            Log::channel('verify_email')->info('Verify email sent', [
                'user_id' => $user->id,
                'email'   => $user->email,
            ]);

            return [
                'message' => __(
                    'domains/auth.register_success',
                    ['email' => $user->email]
                ),
            ];
        } catch (\Throwable $e) {
            DB::rollBack();

            Log::channel('verify_email')->error('Register failed', [
                'message' => $e->getMessage(),
                'line'    => $e->getLine(),
                'file'    => $e->getFile(),
            ]);

            if ($uploadedAvatar)  ImageHelper::delete($uploadedAvatar);
            if ($uploadedBgImage) ImageHelper::delete($uploadedBgImage);
            throw $e;
        }
    }
}

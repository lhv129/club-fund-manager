<?php

namespace App\Domains\BankAccount\Services;
use App\Exceptions\ApiException;

class BankProviderService
{
    /**
     * Danh sách ngân hàng hỗ trợ.
     *
     * Sau này có thể đổi thành:
     * - call Casso API
     * - call Seepay API
     * - call VietQR API
     */
    public static function banks(): array
    {
        return [
            [
                'code' => 'VCB',
                'name' => 'Vietcombank',
            ],
            [
                'code' => 'BIDV',
                'name' => 'BIDV',
            ],
            [
                'code' => 'CTG',
                'name' => 'VietinBank',
            ],
            [
                'code' => 'AGRIBANK',
                'name' => 'Agribank',
            ],
            [
                'code' => 'MB',
                'name' => 'MB Bank',
            ],
            [
                'code' => 'TCB',
                'name' => 'Techcombank',
            ],
            [
                'code' => 'ACB',
                'name' => 'ACB',
            ],
            [
                'code' => 'TPB',
                'name' => 'TPBank',
            ],
            [
                'code' => 'STB',
                'name' => 'Sacombank',
            ],
            [
                'code' => 'VPB',
                'name' => 'VPBank',
            ],
            [
                'code' => 'HDB',
                'name' => 'HDBank',
            ],
            [
                'code' => 'SHB',
                'name' => 'SHB',
            ],
            [
                'code' => 'SEAB',
                'name' => 'SeABank',
            ],
            [
                'code' => 'OCB',
                'name' => 'OCB',
            ],
            [
                'code' => 'EIB',
                'name' => 'Eximbank',
            ],
        ];
    }

    /**
     * Lấy bank_code từ bank_name.
     */
    public static function code(string $bankName): string
    {
        foreach (self::banks() as $bank) {
            if (strcasecmp($bank['name'], $bankName) === 0) {
                return $bank['code'];
            }
        }

        throw new ApiException(__('domains/bank_account.bank_not_supported'), 422);
    }

    /**
     * Lấy bank_name từ bank_code.
     */
    public static function name(string $bankCode): string
    {
        foreach (self::banks() as $bank) {
            if (strcasecmp($bank['code'], $bankCode) === 0) {
                return $bank['name'];
            }
        }

        throw new ApiException(__('domains/bank_account.bank_not_supported'), 422);
    }

    /**
     * Lấy đầy đủ thông tin ngân hàng.
     */
    public static function find(string $bankCode): ?array
    {
        foreach (self::banks() as $bank) {
            if (strcasecmp($bank['code'], $bankCode) === 0) {
                return $bank;
            }
        }

        return null;
    }
}
<?php

namespace App\Helpers;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Encoders\WebpEncoder;
use Intervention\Image\ImageManager;

class ImageHelper
{
    protected static function manager(): ImageManager
    {
        return new ImageManager(new Driver());
    }

    /**
     * Upload một ảnh, convert sang WebP, lưu vào storage/public.
     *
     * Cấu trúc path:
     *   DB lưu  : /uploads/{folder}/xxx.webp  (có leading slash, FE tự ghép domain)
     *   Storage : uploads/{folder}/xxx.webp   (không có leading slash)
     *
     * Ví dụ folder:
     *   'clubs/14/logo'  → /uploads/clubs/14/logo/xxx.webp
     *   'news/5/thumb'   → /uploads/news/5/thumb/xxx.webp
     *
     * @param  mixed       $file     UploadedFile từ $request->file(...)
     * @param  string      $folder   Thư mục con bất kỳ, vd: 'clubs/14/logo'
     * @param  string|null $oldFile  Path cũ ("/uploads/...") để xóa sau khi upload xong
     * @param  int         $quality  WebP quality 1-100
     * @return string                Path dạng "/uploads/{folder}/xxx.webp" để lưu DB
     */
    public static function uploadSingle(
        $file,
        string $folder,
        ?string $oldFile = null,
        int $quality = 95
    ): string {
        $name     = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $filename = time() . '-' . Str::slug($name) . '-' . uniqid() . '.webp';

        // Path lưu DB — bắt đầu bằng /
        $dbPath      = "/uploads/{$folder}/{$filename}";
        // Path cho Storage ops — không có leading /
        $storagePath = "uploads/{$folder}/{$filename}";

        $encoded = self::manager()->decode($file)->encode(new WebpEncoder(quality: $quality));
        Storage::disk('public')->put($storagePath, (string) $encoded);

        // Xóa ảnh cũ sau khi upload thành công
        if ($oldFile) {
            Storage::disk('public')->delete(ltrim($oldFile, '/'));
        }

        return $dbPath;
    }

    /**
     * Upload nhiều ảnh, trả về mảng path "/uploads/...".
     *
     * @param  array  $files   Mảng UploadedFile
     * @param  string $folder  Thư mục con, vd: 'news/5/gallery'
     * @return string[]        Mảng path "/uploads/{folder}/xxx.webp"
     */
    public static function uploadMultiple(array $files, string $folder, int $quality = 95): array
    {
        $paths = [];

        foreach ($files as $index => $file) {
            if (!$file) continue;

            $name     = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $filename = time() . '-' . Str::slug($name) . '-' . $index . '-' . uniqid() . '.webp';

            $dbPath      = "/uploads/{$folder}/{$filename}";
            $storagePath = "uploads/{$folder}/{$filename}";

            $encoded = self::manager()->decode($file)->encode(new WebpEncoder(quality: $quality));
            Storage::disk('public')->put($storagePath, (string) $encoded);

            $paths[] = $dbPath;
        }

        return $paths;
    }

    /**
     * Xóa một file ảnh.
     * Chấp nhận cả "/uploads/..." và "uploads/..." (có hoặc không có leading slash).
     */
    public static function delete(?string $path): void
    {
        if (!$path) return;

        Storage::disk('public')->delete(ltrim($path, '/'));
    }

    /**
     * Xóa toàn bộ thư mục và mọi file bên trong.
     *
     * Dùng khi xóa entity để dọn sạch toàn bộ ảnh liên quan.
     * Chấp nhận cả "/uploads/clubs/14" và "clubs/14" (tự chuẩn hoá).
     *
     * @example ImageHelper::deleteFolder("clubs/{$club->id}");
     *          → xóa uploads/clubs/14/ và toàn bộ subfolder (logo, gallery...)
     */
    public static function deleteFolder(string $folder): void
    {
        // Chuẩn hoá: strip leading slash, strip prefix 'uploads/' nếu có,
        // rồi ghép lại thành 'uploads/{folder}'
        $folder      = ltrim($folder, '/');
        $folder      = ltrim($folder, 'uploads/');
        $storagePath = "uploads/{$folder}";

        if (Storage::disk('public')->exists($storagePath)) {
            Storage::disk('public')->deleteDirectory($storagePath);
        }
    }

    /**
     * Trả về full URL (dùng trong API Resource nếu cần trả URL cho FE).
     * Nếu FE tự ghép URL từ path thì không cần method này.
     *
     * "/uploads/clubs/14/logo/xxx.webp" → "https://host/storage/uploads/clubs/14/logo/xxx.webp"
     */
    public static function url(?string $path): ?string
    {
        if (!$path) return null;

        return Storage::url(ltrim($path, '/'));
    }
}

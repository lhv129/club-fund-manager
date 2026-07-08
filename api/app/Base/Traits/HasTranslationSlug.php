<?php

namespace App\Base\Traits;

use Illuminate\Support\Str;

/**
 * Sinh slug tự động cho bảng translation.
 *
 * Convention:
 *   - Bảng translation : {singular_parent}_translations  (vd: clubs → club_translations)
 *   - Khoá ngoại       : {singular_parent}_id            (vd: club_id)
 *
 * Nguồn sinh slug (ưu tiên): slug → name → title
 *
 * Unique name/locale được validate sớm ở Request (UniqueTranslation rule),
 * nên trait chỉ còn đảm nhiệm việc sinh slug — không cần check trùng ở đây.
 */
trait HasTranslationSlug
{
    /** Các field được dùng để sinh slug, theo thứ tự ưu tiên */
    protected array $slugSourceFields = ['slug', 'name', 'title'];

    /**
     * Sinh slug cho toàn bộ mảng translations.
     *
     * @param  array  $translations  [['locale'=>.., 'name'=>.., 'slug'=>..], ...]
     * @param  string $parentTable   tên bảng cha dạng plural, vd: "clubs"
     */
    protected function prepareTranslationSlugs(array $translations, string $parentTable): array
    {
        return array_map(
            fn(array $t) => $this->resolveTranslationSlug($t),
            $translations
        );
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    private function resolveTranslationSlug(array $translation): array
    {
        $base = $this->pickSlugSource($translation);

        if ($base === null) {
            return $translation;
        }

        $translation['slug'] = Str::slug($base);

        return $translation;
    }

    /**
     * Lấy giá trị gốc để sinh slug theo thứ tự ưu tiên: slug → name → title.
     */
    private function pickSlugSource(array $translation): ?string
    {
        foreach ($this->slugSourceFields as $field) {
            if (!empty($translation[$field])) {
                return $translation[$field];
            }
        }

        return null;
    }
}

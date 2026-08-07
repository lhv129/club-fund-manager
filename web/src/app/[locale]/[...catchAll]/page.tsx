import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/**
 * Catch-all route — /{locale}/{bất kỳ path không khớp route cụ thể}
 *
 * Mọi path không khớp các segment tĩnh (login, register, admin, club, ...)
 * đều rơi vào đây. Gọi notFound() để trigger [locale]/not-found.tsx,
 * render NotFoundView (giữ NextIntlClientProvider + translations).
 *
 * Ưu tiên route: segment tĩnh + nested route được match trước catch-all,
 * nên không xung đột — chỉ path rác (/vi/abccxll, /vi/xyz/abc) mới vào đây.
 *
 * Lưu ý: validate locale trước khi setRequestLocale — tránh gọi
 * setRequestLocale với locale không hỗ trợ (vd /fr/...), gây lỗi runtime
 * ở next-intl. Locale không hợp lệ → notFound() ngay.
 */
export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string; catchAll: string[] }>;
}) {
  const { locale } = await params;

  // Locale không hỗ trợ → 404 ngay, KHÔNG setRequestLocale
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  notFound();
}

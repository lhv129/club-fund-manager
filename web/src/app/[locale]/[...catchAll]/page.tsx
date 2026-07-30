import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/**
 * Catch-all route — /{locale}/{bất kỳ path không khớp route cụ thể}
 *
 * Mọi path không khớp các segment tĩnh (login, register, admin, club, ...)
 * đều rơi vào đây. Gọi notFound() để trigger [locale]/not-found.tsx,
 * render NotFoundView (giữ NextIntlClientProvider + translations).
 *
 * Ưu tiên route: segment tĩnh + nested route được match trước catch-all,
 * nên không xung đột — chỉ path rác (/vi/abccxll, /vi/xyz/abc) mới vào đây.
 */
export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string; catchAll: string[] }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  notFound();
}

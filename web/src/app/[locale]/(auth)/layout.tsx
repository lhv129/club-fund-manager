import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { COOKIE_NAMES } from "@/constants";
import { LocaleSwitcher } from "@/components/shared/layout/LocaleSwitcher";

/**
 * Auth layout — /{locale}/login | /{locale}/register
 *
 * Defense-in-depth: nếu user đã login (còn access_token HOẶC refresh_token)
 * thì không cho vào login/register nữa → redirect về root để phân luồng.
 *
 * Lớp chính là middleware, nhưng middleware có thể bị stale khi Turbopack
 * (Next 16 dev) không hot-reload → layout này là chặn server-side dự phòng.
 * Layout là Server Component → đọc httpOnly cookie qua cookies() được.
 */
export default async function AuthLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const cookieStore = await cookies();
  const accessToken = cookieStore.get(COOKIE_NAMES.accessToken)?.value;
  const refreshToken = cookieStore.get(COOKIE_NAMES.refreshToken)?.value;
  if (accessToken || refreshToken) {
    redirect(`/${locale}`);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="absolute right-4 top-4">
        <LocaleSwitcher />
      </div>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-zinc-900">Club Fund Manager</h1>
      </div>
      {children}
    </div>
  );
}

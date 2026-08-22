"use client";

import { useLocale } from "next-intl";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { APP_ROUTES } from "@/constants";
import { Menu } from "lucide-react";
import { AvatarDropdown } from "./AvatarDropdown";
import { useThemeMode } from "@/utils/useThemeMode";
import { NotificationDropdown } from "@/components/shared/layout/NotificationDropDown/NotificationDropdown";

// ─── Header Skeleton ──────────────────────────────────────────────────────────

/**
 * Hiển thị trong 1 frame đầu tiên khi store chưa hydrate xong.
 * Layout khớp chính xác với Header thật để không bị layout shift.
 */
function HeaderSkeleton() {
  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-zinc-200 dark:border-gray-800 px-4 lg:px-6 flex items-center justify-between shrink-0">
      {/* Left: menu toggle placeholder (mobile only) */}
      <div className="flex items-center">
        <div className="lg:hidden w-9 h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>

      {/* Right: locale switcher + avatar placeholders */}
      <div className="flex items-center gap-2">
        {/* LocaleSwitcher placeholder */}
        <div className="w-16 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
        {/* Avatar placeholder */}
        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
      </div>
    </header>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const locale = useLocale();
  const { user, logout } = useAuth();

  useThemeMode();

  // Store chưa hydrate (useHydrateAuth dùng useEffect — chạy sau 1 frame).
  // Skeleton giữ layout ổn định, không bị flash "logged out".
  if (!user) return <HeaderSkeleton />;

  const handleLogout = async () => {
    await logout();

    // Do not overlap a client transition with router.refresh after clearing
    // auth cookies. Start the logged-out session with a fresh RSC runtime.
    window.location.replace(`/${locale}${APP_ROUTES.login}`);
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-900 border-b border-zinc-200 dark:border-gray-800 px-4 lg:px-6 flex items-center justify-between shrink-0">
      {/* Left: mobile menu toggle */}
      <div className="flex items-center">
        <button
          className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Right: locale switcher + avatar */}
      <div className="flex items-center gap-2">
        <LocaleSwitcher />
        <NotificationDropdown />
        <AvatarDropdown user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
}

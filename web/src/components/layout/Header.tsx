"use client";

import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { LocaleSwitcher } from "../LocaleSwitcher";
import { APP_ROUTES } from "@/constants";
import { Menu } from "lucide-react";
import { AvatarDropdown } from "../AvatarDropdown";

interface HeaderProps {
  onMenuToggle: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push(APP_ROUTES.login);
    router.refresh();
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
        {user && <AvatarDropdown user={user} onLogout={handleLogout} />}
      </div>
    </header>
  );
}

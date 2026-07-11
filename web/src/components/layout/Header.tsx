"use client";

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/routing";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { APP_ROUTES } from "@/constants";

export function Header() {
  const t = useTranslations("common");
  const router = useRouter();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    router.push(APP_ROUTES.login);
    router.refresh();
  };

  const initials = user?.fullname
    ?.split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();

  return (
    <header className="flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-6">
      <div className="flex-1" />

      <div className="flex items-center gap-4">
        <LocaleSwitcher />

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-zinc-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
              {initials ?? "?"}
            </div>
            <span className="text-sm font-medium text-zinc-700">
              {user?.fullname ?? "User"}
            </span>
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-48 rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
              <div className="border-b border-zinc-100 px-4 py-2">
                <p className="text-sm font-medium text-zinc-900">
                  {user?.fullname}
                </p>
                <p className="truncate text-xs text-zinc-500">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="block w-full px-4 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100"
              >
                {t("logout")}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import { Header } from "./Header";
import { useHydrateAuth } from "@/domains/auth/hooks/useAuth";
import type { Profile } from "@/domains/auth/types";

/**
 * LandingShell — client wrapper cho root landing ("/").
 *
 * Khác với AdminShell (có Sidebar system) và ClubShell (có ClubSidebar),
 * LandingShell chỉ render Header + content — dùng cho trang chọn club /
 * no-club, nơi user chưa vào workspace cụ thể.
 *
 * Hydrate auth store với profile do Server Component fetch để Header
 * (avatar, logout, locale switcher) hoạt động.
 */
export function LandingShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  useHydrateAuth(profile);

  return (
    <div className="flex h-screen overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => {}} />
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-gray-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

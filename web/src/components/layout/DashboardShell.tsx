"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useHydrateAuth } from "@/domains/auth/hooks/useAuth";
import type { Profile } from "@/domains/auth/types";

/**
 * DashboardShell — client wrapper cho Dashboard workspace (system pages).
 *
 * Hydrate auth store với profile do Server Component fetch,
 * render Sidebar (system nav) + Header + content.
 */
export function DashboardShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  useHydrateAuth(profile);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />
        <main className="flex-1 overflow-y-auto bg-zinc-50 dark:bg-gray-950 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

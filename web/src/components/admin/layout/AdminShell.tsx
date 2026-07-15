"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "../../shared/layout/Header";
import { useHydrateAuth } from "@/domains/auth/hooks/useAuth";
import type { Profile } from "@/domains/auth/types";

/**
 * AdminShell — client wrapper cho Admin workspace (system pages).
 *
 * Hydrate auth store với profile do Server Component fetch,
 * render Sidebar (system nav) + Header + content.
 */
export function AdminShell({
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

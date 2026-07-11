"use client";

import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useHydrateAuth } from "@/domains/auth/hooks/useAuth";
import type { Profile } from "@/domains/auth/types";

/**
 * DashboardShell — client component that wraps Sidebar + Header + content.
 * Hydrates the auth store with server-fetched profile.
 */
export function DashboardShell({
  profile,
  children,
}: {
  profile: Profile | null;
  children: React.ReactNode;
}) {
  useHydrateAuth(profile);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto bg-zinc-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

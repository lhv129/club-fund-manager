"use client";

import { useState } from "react";
import { ClubSidebar } from "./ClubSidebar";
import { Header } from "../../shared/layout/Header";
import { useHydrateAuth } from "@/domains/auth/hooks/useAuth";
import { useHydrateClub } from "@/domains/club/hooks/useClub";
import type { Profile } from "@/domains/auth/types";
import type { Club } from "@/domains/club/types";

/**
 * ClubShell — client wrapper cho Club workspace (/club/[slug]/...).
 *
 * Hydrate cả auth store lẫn club store với data do Server Component fetch,
 * render ClubSidebar + Header + content.
 */
export function ClubShell({
  profile,
  club,
  children,
}: {
  profile: Profile | null;
  club: Club | null;
  children: React.ReactNode;
}) {
  useHydrateAuth(profile);
  useHydrateClub(club);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <ClubSidebar
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

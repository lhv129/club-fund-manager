"use client";

import {
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";

import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useClub } from "@/domains/club/hooks/useClub";
import { cn } from "@/utils";

import {
  CLUB_NAV_ITEMS,
  filterNav,
} from "./club-nav-config";
import { getTranslation } from "@/lib/translations";
import { APP_ROUTES } from "@/constants";

import { ClubSidebarHeader } from "./ClubSidebarHeader";
import { ClubSidebarMain } from "./ClubSidebarMain";
import { ClubSidebarFooter } from "./ClubSidebarFooter";

interface ClubSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function ClubSidebar({
  open,
  onClose,
}: ClubSidebarProps) {
  const t = useTranslations("menu") as (
    key: string,
  ) => string;

  const tWorkspace = useTranslations(
    "clubWorkspace",
  ) as (key: string) => string;

  const pathname = usePathname() as string;
  const currentLocale = useLocale() as string;

  const {
    hasPermission,
    isSuperAdmin,
    isSystemAdmin,
    hasMultipleClubs,
  } = useAuth();

  const { club } = useClub();

  const sidebarRef =
    useRef<HTMLDivElement>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // Club slug
  // ───────────────────────────────────────────────────────────────────────────

  const slug =
    getTranslation(
      club?.translations,
      currentLocale,
    )?.slug ??
    pathname.split("/")[2] ??
    String(club?.id ?? "");

  // ───────────────────────────────────────────────────────────────────────────
  // Invite permission
  // ───────────────────────────────────────────────────────────────────────────

  const canCreateInvite =
    isSuperAdmin ||
    isSystemAdmin ||
    hasPermission(
      "club_invite",
      "create",
      club?.id,
    );

  // ───────────────────────────────────────────────────────────────────────────
  // Back navigation
  // ───────────────────────────────────────────────────────────────────────────

  const backHref =
    isSuperAdmin || isSystemAdmin
      ? APP_ROUTES.adminClubs
      : APP_ROUTES.home;

  const showBackToClubs =
    isSuperAdmin ||
    isSystemAdmin ||
    hasMultipleClubs;

  const showJoinClub =
    !isSuperAdmin &&
    !isSystemAdmin &&
    !hasMultipleClubs;

  // ───────────────────────────────────────────────────────────────────────────
  // Navigation
  // ───────────────────────────────────────────────────────────────────────────

  const filtered = useMemo(() => {
    if (!club) return [];

    const items = CLUB_NAV_ITEMS(slug);

    const clubCheck = (
      module?: string,
      action?: string,
    ) =>
      hasPermission(
        module!,
        action!,
        club.id,
      ) ||
      (isSystemAdmin &&
        hasPermission(
          module!,
          action!,
        ));

    return filterNav(
      items,
      clubCheck,
      isSuperAdmin,
    );
  }, [
    club,
    slug,
    hasPermission,
    isSuperAdmin,
    isSystemAdmin,
  ]);

  // ───────────────────────────────────────────────────────────────────────────
  // Close on outside click
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(
      event: MouseEvent,
    ) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(
          event.target as Node,
        )
      ) {
        onClose();
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside,
      );
    };
  }, [open, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[264px] flex flex-col",
          "bg-background border-r border-border",
          "shadow-[1px_0_0_0_rgba(0,0,0,0.04)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none",
          "lg:sticky lg:top-0 lg:h-screen",
          open
            ? "translate-x-0"
            : "-translate-x-full",
        )}
      >
        <ClubSidebarHeader
          club={club}
          currentLocale={currentLocale}
          isSuperAdmin={isSuperAdmin}
          isSystemAdmin={isSystemAdmin}
          onClose={onClose}
        />

        <ClubSidebarMain
          items={filtered}
          pathname={pathname}
          onClose={onClose}
          t={t}
          tWorkspace={tWorkspace}
          showBackToClubs={showBackToClubs}
          showJoinClub={showJoinClub}
          canCreateInvite={canCreateInvite}
          backHref={backHref}
          slug={slug}
        />

        <ClubSidebarFooter />
      </aside>
    </>
  );
}
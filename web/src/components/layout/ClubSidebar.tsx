"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useClub } from "@/domains/club/hooks/useClub";
import { cn } from "@/utils";
import { X, ArrowLeft, ShieldCheck } from "lucide-react";
import {
  CLUB_NAV_ITEMS,
  type ClubNavItem,
} from "./club-nav-config";
import { clubRoute, APP_ROUTES } from "@/constants";
import type { Translation } from "@/domains/club/types";

interface ClubSidebarProps {
  open: boolean;
  onClose: () => void;
}

/** Lấy bản dịch theo locale hiện tại, fallback phần tử đầu. */
function pickTranslation(
  translations: Translation[] | undefined,
  locale: string,
): Translation | undefined {
  return (
    translations?.find((item) => item.locale === locale) ?? translations?.[0]
  );
}

// ─── Leaf item ─────────────────────────────────────────────────────────────
function ClubNavLeaf({
  item,
  slug,
  pathname,
  onClose,
  t,
}: {
  item: ClubNavItem;
  slug: string;
  pathname: string;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const Icon = item.icon;
  const href = clubRoute(slug, item.sub as never);

  // pathname từ next-intl đã loại bỏ locale prefix → so khớp trực tiếp
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href as never}
      onClick={onClose}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
        "transition-all duration-200 ease-out",
        isActive
          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-0.5"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0 transition-transform duration-200",
          !isActive && "group-hover:scale-110"
        )}
        strokeWidth={1.75}
      />
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

// ─── ClubSidebar ───────────────────────────────────────────────────────────
export function ClubSidebar({ open, onClose }: ClubSidebarProps) {
  const t = useTranslations("menu") as (key: string) => string;
  const tWorkspace = useTranslations("clubWorkspace") as (key: string) => string;
  const pathname = usePathname() as string;
  const { isSuperAdmin, hasPermission, hasAnyClubPermission } = useAuth();
  const { club } = useClub();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Lấy slug từ club.translations theo locale hiện tại.
  // Re-render khi locale đổi nhờ useLocale().
  const currentLocale = useLocale() as string;

  const slug =
    pickTranslation(club?.translations, currentLocale)?.slug ??
    // fallback: parse slug từ pathname /club/{slug}/...
    (pathname.split("/")[2] ?? String(club?.id ?? ""));

  // Lọc nav items theo CLUB SCOPE — truyền club.id.
  const filtered = club
    ? CLUB_NAV_ITEMS.filter((item) =>
        hasPermission(item.module, item.action, club.id),
      )
    : [];

  // Nút "← Quay lại danh sách CLB" — superadmin hoặc có quyền ở bất kỳ club nào.
  const showBackToClubs = isSuperAdmin || hasAnyClubPermission();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  const clubName = pickTranslation(club?.translations, currentLocale)?.name;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      <aside
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-64 flex flex-col shadow-2xl",
          "bg-white dark:bg-gray-900 border-r border-zinc-200 dark:border-gray-800",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo + close */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-gray-800 px-5 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold transition-transform duration-200 hover:scale-105">
              C
            </span>
            <span className="text-lg font-bold text-foreground tracking-tight">
              Club Fund
            </span>
          </div>
          <button
            className="lg:hidden rounded-lg p-1.5 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground hover:rotate-90"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Club context + back button */}
        <div className="border-b border-zinc-200 dark:border-gray-800 px-3 py-3 space-y-2 shrink-0">
          {showBackToClubs && (
            <Link
              href={APP_ROUTES.adminClubs as never}
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              {tWorkspace("backToClubs")}
            </Link>
          )}
          <div className="rounded-lg bg-blue-50 dark:bg-blue-500/5 px-2.5 py-2">
            <p className="text-xs text-muted-foreground">
              {tWorkspace("currentClub")}
            </p>
            <p className="text-sm font-semibold text-foreground truncate">
              {clubName ?? "—"}
            </p>
            {isSuperDashboard && (
              <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:text-amber-400">
                <ShieldCheck className="h-3 w-3" />
                {tWorkspace("viewingAsSuperDashboard")}
              </span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-3">
          {filtered.map((item) => (
            <ClubNavLeaf
              key={item.sub}
              item={item}
              slug={slug}
              pathname={pathname}
              onClose={onClose}
              t={t}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="shrink-0 border-t border-zinc-200 dark:border-gray-800 px-5 py-4">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Club Fund. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}

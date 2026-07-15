"use client";

import { useEffect, useRef } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useClub } from "@/domains/club/hooks/useClub";
import { cn } from "@/utils";
import { X, ArrowLeft, Shield } from "lucide-react";
import { CLUB_NAV_ITEMS, type ClubNavItem } from "./club-nav-config";
import { clubRoute } from "@/constants";
import type { Translation } from "@/domains/club/types";

interface ClubSidebarProps {
  open: boolean;
  onClose: () => void;
}

function pickTranslation(
  translations: Translation[] | undefined,
  locale: string,
): Translation | undefined {
  return (
    translations?.find((item) => item.locale === locale) ?? translations?.[0]
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────
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
  const isActive = pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href as never}
      onClick={onClose}
      className={cn(
        "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
        isActive
          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
      )}
    >
      <Icon
        className={cn(
          "w-5 h-5 shrink-0",
          isActive ? "text-white" : "text-zinc-400"
        )}
        strokeWidth={isActive ? 2.5 : 2}
      />
      <span className="truncate">{t(item.labelKey)}</span>
    </Link>
  );
}

// ─── ClubSidebar ──────────────────────────────────────────────────────────────
export function ClubSidebar({ open, onClose }: ClubSidebarProps) {
  const t = useTranslations("menu") as (key: string) => string;
  const tWorkspace = useTranslations("clubWorkspace") as (key: string) => string;
  const pathname = usePathname() as string;
  const { isSuperAdmin, hasPermission, hasAnyClubPermission } = useAuth();
  const { club } = useClub();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const currentLocale = useLocale() as string;

  const slug =
    pickTranslation(club?.translations, currentLocale)?.slug ??
    (pathname.split("/")[2] ?? String(club?.id ?? ""));

  const filtered = club
    ? CLUB_NAV_ITEMS.filter((item) =>
      hasPermission(item.module, item.action, club.id),
    )
    : [];

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
          "fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col",
          "bg-white dark:bg-gray-900 border-r border-zinc-200 dark:border-gray-800",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* ── Logo ── */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100 dark:border-gray-800 shrink-0">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-black text-lg mr-3 shadow-[0_2px_10px_-2px_rgba(37,99,235,0.6)]">
              C
            </div>
            <span className="font-extrabold text-zinc-900 dark:text-white text-xl tracking-tight">
              Club Fund
            </span>
          </div>
          <button
            className="lg:hidden rounded-lg p-1.5 text-zinc-400 transition-all duration-200 hover:bg-zinc-100 hover:text-zinc-900 hover:rotate-90"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="pt-6 pb-4 flex-1 flex flex-col gap-6 overflow-y-auto">

          {/* Club context */}
          <div className="px-5">
            {showBackToClubs && (
              <Link
                href={"/" as never}
                onClick={onClose}
                className="text-xs font-bold text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1.5 transition-colors mb-4 uppercase tracking-wider"
              >
                <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
                {tWorkspace("backToClubs")}
              </Link>
            )}

            {/* Club card */}
            <div className="bg-white dark:bg-gray-800 border border-zinc-200 dark:border-gray-700 rounded-xl p-4 shadow-sm relative overflow-hidden group hover:border-blue-200 dark:hover:border-blue-500/30 transition-colors cursor-pointer">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1.5">
                {tWorkspace("currentClub")}
              </div>
              <div className="font-extrabold text-zinc-900 dark:text-white text-base mb-3 truncate group-hover:text-blue-600 transition-colors">
                {clubName ?? "—"}
              </div>
              {isSuperAdmin && (
                <div className="inline-flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-2.5 py-1.5 rounded-lg text-xs font-bold w-full shadow-sm">
                  <Shield className="w-4 h-4 text-amber-500 shrink-0" strokeWidth={2.5} />
                  <span className="truncate">{tWorkspace("viewingAsSuperAdmin")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Nav */}
          <div className="px-3 flex-1 flex flex-col gap-1.5">
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
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="p-5 border-t border-zinc-100 dark:border-gray-800 bg-zinc-50/50 dark:bg-gray-900/50 shrink-0">
          <p className="text-[11px] font-bold text-zinc-400 text-center uppercase tracking-wider">
            © {new Date().getFullYear()} Club Fund
          </p>
        </div>
      </aside>
    </>
  );
}
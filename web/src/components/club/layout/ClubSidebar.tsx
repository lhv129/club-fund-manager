"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { useClub } from "@/domains/club/hooks/useClub";
import { cn } from "@/utils";
import { ArrowLeft, ChevronDown, Shield, X } from "lucide-react";
import { CLUB_NAV_ITEMS, filterNav, type NavItem } from "./club-nav-config";
import type { Translation } from "@/domains/club/types";
import { APP_VERSION } from "@/lib/config";


// ─── Types ────────────────────────────────────────────────────────────────────

interface ClubSidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickTranslation(
  translations: Translation[] | undefined,
  locale: string,
): Translation | undefined {
  return translations?.find((t) => t.locale === locale) ?? translations?.[0];
}

// ─── SidebarItem ──────────────────────────────────────────────────────────────

interface SidebarItemProps {
  item: NavItem;
  pathname: string;
  onClose: () => void;
  t: (key: string) => string;
  depth?: number;
}

const SidebarItem = memo(function SidebarItem({
  item,
  pathname,
  onClose,
  t,
  depth = 0,
}: SidebarItemProps) {
  const Icon = item.icon;

  const isActive = useMemo(() => {
    if (!item.href) return false;
    if (item.href === "/") return pathname === "/";
    return item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  }, [item.href, item.exact, pathname]);

  return (
    <div className="relative">
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-[2.5px] h-5 bg-blue-600 dark:bg-blue-500 rounded-full"
        />
      )}

      <Link
        href={(item.href ?? "/") as never}
        onClick={onClose}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "group flex items-center gap-2.5 rounded-lg text-sm transition-all duration-200 outline-none",
          "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
          depth === 0 ? "px-3 py-2" : "px-2.5 py-1.5",
          isActive
            ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-semibold shadow-sm"
            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium"
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4 shrink-0 transition-all duration-200",
            isActive
              ? "text-blue-600 dark:text-blue-400"
              : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <span className="truncate leading-tight">{t(item.labelKey)}</span>
      </Link>
    </div>
  );
});

// ─── SidebarGroup ─────────────────────────────────────────────────────────────

interface SidebarGroupProps {
  item: NavItem;
  pathname: string;
  onClose: () => void;
  t: (key: string) => string;
}

const SidebarGroup = memo(function SidebarGroup({
  item,
  pathname,
  onClose,
  t,
}: SidebarGroupProps) {
  const Icon = item.icon;

  const isChildActive = useMemo(
    () => item.children?.some((c) => c.href && pathname.startsWith(c.href)) ?? false,
    [item.children, pathname]
  );

  const [expanded, setExpanded] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) setExpanded(true);
  }, [isChildActive]);

  const toggle = useCallback(() => setExpanded((v) => !v), []);

  return (
    <div>
      <button
        onClick={toggle}
        aria-expanded={expanded}
        aria-label={`${t(item.labelKey)} menu`}
        className={cn(
          "group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none",
          "focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1",
          isChildActive
            ? "text-zinc-900 dark:text-zinc-100"
            : "text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/70 hover:text-zinc-900 dark:hover:text-zinc-100"
        )}
      >
        <Icon
          className={cn(
            "w-4 h-4 shrink-0 transition-all duration-200",
            isChildActive
              ? "text-blue-600 dark:text-blue-400"
              : "text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"
          )}
          strokeWidth={isChildActive ? 2.5 : 2}
        />
        <span className="flex-1 text-left truncate leading-tight">{t(item.labelKey)}</span>

        {isChildActive && (
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0"
          />
        )}

        <ChevronDown
          aria-hidden="true"
          className={cn(
            "h-3.5 w-3.5 shrink-0 text-zinc-400 transition-transform duration-250 ease-out",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Collapsible — CSS grid trick */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-250 ease-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-1 ml-[22px] pl-3 py-0.5 border-l border-zinc-200 dark:border-zinc-700/60 space-y-0.5">
            {item.children?.map((child) => (
              <SidebarItem
                key={child.href ?? child.labelKey}
                item={child}
                pathname={pathname}
                onClose={onClose}
                t={t}
                depth={1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});

// ─── SidebarNav ───────────────────────────────────────────────────────────────

const SidebarNav = memo(function SidebarNav({
  items,
  pathname,
  onClose,
  t,
}: {
  items: NavItem[];
  pathname: string;
  onClose: () => void;
  t: (key: string) => string;
}) {
  return (
    <nav
      role="navigation"
      aria-label="Club navigation"
      className="flex-1 py-4 px-3 lg:px-5 space-y-1.5"
    >
      {items.map((item) =>
        item.children ? (
          <SidebarGroup
            key={item.labelKey}
            item={item}
            pathname={pathname}
            onClose={onClose}
            t={t}
          />
        ) : (
          <SidebarItem
            key={item.href ?? item.labelKey}
            item={item}
            pathname={pathname}
            onClose={onClose}
            t={t}
          />
        )
      )}
    </nav>
  );
});

// ─── ClubSidebarHeader ────────────────────────────────────────────────────────

const ClubSidebarHeader = memo(function ClubSidebarHeader({
  onClose,
}: {
  onClose: () => void;
}) {
  const t = useTranslations("app") as (key: string) => string;

  return (
    <div className="h-16 flex items-center justify-between px-4 lg:px-6 border-b border-zinc-200 dark:border-gray-800 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0 shadow-sm shadow-blue-600/30">
          <span className="text-white font-black text-base leading-none">C</span>
        </div>
        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight leading-tight truncate">
          {t("name")}
        </p>
      </div>

      <button
        aria-label="Close sidebar"
        onClick={onClose}
        className="lg:hidden rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200 transition-all duration-200 hover:rotate-90 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

// ─── ClubContextCard ──────────────────────────────────────────────────────────

const ClubContextCard = memo(function ClubContextCard({
  clubName,
  isSuperAdmin,
  showBackToClubs,
  onClose,
}: {
  clubName: string | undefined;
  isSuperAdmin: boolean;
  showBackToClubs: boolean;
  onClose: () => void;
}) {
  const tWorkspace = useTranslations("clubWorkspace") as (key: string) => string;

  return (
    <div className="px-4 lg:px-5 pt-5 pb-3">
      {showBackToClubs && (
        <Link
          href={"/" as never}
          onClick={onClose}
          className="flex items-center gap-1.5 mb-4 text-xs font-semibold text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 uppercase tracking-wider transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={2.5} />
          {tWorkspace("backToClubs")}
        </Link>
      )}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 p-3.5 space-y-2">
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
          {tWorkspace("currentClub")}
        </p>
        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 truncate">
          {clubName ?? "—"}
        </p>
        {isSuperAdmin && (
          <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-500/10 border border-amber-200/80 dark:border-amber-500/20 text-amber-700 dark:text-amber-400 px-2.5 py-1.5 rounded-lg text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={2.5} />
            <span className="truncate">{tWorkspace("viewingAsSuperAdmin")}</span>
          </div>
        )}
      </div>
    </div>
  );
});

// ─── ClubSidebarFooter ────────────────────────────────────────────────────────

const ClubSidebarFooter = memo(function ClubSidebarFooter() {
  const t = useTranslations("app") as (key: string) => string;

  return (
    <div className="px-4 lg:px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 shrink-0 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-500 dark:text-zinc-400">{t("version")}</span>
        <span className="font-medium text-zinc-700 dark:text-zinc-200">v{APP_VERSION}</span>
      </div>
      <div className="pt-1.5 border-t border-zinc-100 dark:border-zinc-800">
        <p className="text-center text-[11px] text-zinc-400 dark:text-zinc-500">
          © {new Date().getFullYear()} {t("fullName")}
        </p>
      </div>
    </div>
  );
});

// ─── ClubSidebar (main) ───────────────────────────────────────────────────────

export function ClubSidebar({ open, onClose }: ClubSidebarProps) {
  const t = useTranslations("menu") as (key: string) => string;
  const pathname = usePathname() as string;
  const currentLocale = useLocale() as string;
  const { hasPermission, isSuperAdmin, hasAnyClubPermission } = useAuth();
  const { club } = useClub();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Lấy slug từ club translations (locale hiện tại)
  const slug =
    pickTranslation(club?.translations, currentLocale)?.slug ??
    pathname.split("/")[2] ??
    String(club?.id ?? "");

  const clubName = pickTranslation(club?.translations, currentLocale)?.name;
  const showBackToClubs = isSuperAdmin || hasAnyClubPermission();

  // Build items với real hrefs + filter theo club-scoped permission
  const filtered = useMemo(() => {
    if (!club) return [];
    const items = CLUB_NAV_ITEMS(slug);
    const clubCheck = (module?: string, action?: string) =>
      hasPermission(module!, action!, club.id);
    return filterNav(items, clubCheck, isSuperAdmin);
  }, [club, slug, hasPermission, isSuperAdmin]);

  // Close on outside click (mobile)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open, onClose]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[264px] flex flex-col",
          "bg-white dark:bg-zinc-900",
          "border-r border-zinc-200 dark:border-zinc-800",
          "shadow-[1px_0_0_0_rgba(0,0,0,0.04)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none lg:sticky lg:top-0 lg:h-screen",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <ClubSidebarHeader onClose={onClose} />

        {/* Scrollable body */}
        <div className="flex-1 flex flex-col overflow-y-auto">
          <ClubContextCard
            clubName={clubName}
            isSuperAdmin={isSuperAdmin}
            showBackToClubs={showBackToClubs}
            onClose={onClose}
          />

          <SidebarNav
            items={filtered}
            pathname={pathname}
            onClose={onClose}
            t={t}
          />
        </div>

        <ClubSidebarFooter />
      </aside>
    </>
  );
}

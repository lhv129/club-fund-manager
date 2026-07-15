"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { cn } from "@/utils";
import { X, ChevronDown } from "lucide-react";
import { ADMIN_NAV_ITEMS, NavItem, filterNav } from "./nav-config";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

// ─── Leaf item ────────────────────────────────────────────────────────────────
function NavLeaf({
  item,
  pathname,
  onClose,
  t,
  depth = 0,
}: {
  item: NavItem;
  pathname: string;
  onClose: () => void;
  t: (key: string) => string;
  depth?: number;
}) {
  const Icon = item.icon;
  const isActive =
    !!item.href &&
    (item.href === "/"
      ? pathname === "/"
      : item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`));

  return (
    <Link
      href={(item.href ?? "/") as never}
      onClick={onClose}
      className={cn(
        "w-full flex items-center gap-3 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
        depth === 0 ? "px-3.5" : "px-3 ml-4",
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

// ─── Group item ───────────────────────────────────────────────────────────────
function NavGroup({
  item,
  pathname,
  onClose,
  t,
}: {
  item: NavItem;
  pathname: string;
  onClose: () => void;
  t: (key: string) => string;
}) {
  const Icon = item.icon;
  const isChildActive = item.children?.some(
    (c) => c.href && pathname.startsWith(c.href)
  );
  const [expanded, setExpanded] = useState(!!isChildActive);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
          isChildActive
            ? "text-blue-600 dark:text-blue-400"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        )}
      >
        <Icon className="w-5 h-5 shrink-0 text-zinc-400" strokeWidth={2} />
        <span className="flex-1 text-left truncate">{t(item.labelKey)}</span>
        {isChildActive && (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
        )}
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-300 ease-out",
            expanded && "rotate-180"
          )}
        />
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-1 space-y-0.5 border-l-2 border-zinc-100 dark:border-gray-800 ml-5 pl-2 py-0.5">
            {item.children?.map((child) => (
              <NavLeaf
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
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations("menu") as (key: string) => string;
  const pathname = usePathname() as string;
  const { hasPermission, isSuperAdmin, isSystemAdmin } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Admin sidebar dùng SYSTEM SCOPE — không truyền clubId.
  const filtered = filterNav(
    ADMIN_NAV_ITEMS,
    (module, action) => hasPermission(module!, action!),
    isSuperAdmin || isSystemAdmin,
  );

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

        {/* ── Nav ── */}
        <div className="pt-4 pb-4 flex-1 flex flex-col overflow-y-auto">
          <div className="px-3 flex-1 flex flex-col gap-1.5">
            {filtered.map((item) =>
              item.children ? (
                <NavGroup
                  key={item.labelKey}
                  item={item}
                  pathname={pathname}
                  onClose={onClose}
                  t={t}
                />
              ) : (
                <NavLeaf
                  key={item.href ?? item.labelKey}
                  item={item}
                  pathname={pathname}
                  onClose={onClose}
                  t={t}
                />
              )
            )}
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
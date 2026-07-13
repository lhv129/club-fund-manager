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

// ─── Leaf item (no children) ────────────────────────────────────────────────
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
    (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

  return (
    <Link
      href={(item.href ?? "/") as never}
      onClick={onClose}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl py-2.5 text-sm font-medium",
        "transition-all duration-200 ease-out",
        depth === 0 ? "px-3" : "px-3 ml-2",
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

// ─── Group item (has children) ───────────────────────────────────────────────
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
          "group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium",
          "transition-all duration-200 ease-out",
          isChildActive
            ? "text-blue-700 dark:text-blue-400"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon
          className="h-5 w-5 shrink-0 transition-transform duration-200 group-hover:scale-110"
          strokeWidth={1.75}
        />

        <span className="flex-1 text-left truncate">{t(item.labelKey)}</span>

        {isChildActive && (
          <span className="h-1.5 w-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-fade-in" />
        )}

        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-300 ease-out",
            expanded && "rotate-180"
          )}
        />
      </button>

      {/* Expand/collapse mượt bằng CSS grid, không cần đo chiều cao bằng JS */}
      <div
        className={cn(
          "grid transition-[grid-template-rows] duration-300 ease-in-out",
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-0.5 space-y-0.5 border-l-2 border-zinc-100 dark:border-gray-800 ml-[1.15rem] pl-2 py-0.5">
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

// ─── Sidebar ─────────────────────────────────────────────────────────────────
export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations("menu") as (key: string) => string;
  const pathname = usePathname() as string;
  const { hasPermission, isSuperAdmin } = useAuth();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const filtered = filterNav(
    ADMIN_NAV_ITEMS,
    (module, action) => hasPermission(module!, action!),
    isSuperAdmin
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(e.target as Node)
      ) {
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
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar panel */}
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
        {/* Logo */}
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

        {/* Nav */}
        <nav className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto p-3">
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
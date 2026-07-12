"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { useAuth } from "@/domains/auth/hooks/useAuth";
import { cn } from "@/utils";
import { X, ChevronDown } from "lucide-react";
import { NAV_ITEMS, NavItem, filterNav } from "./nav-config";

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
  const isActive =
    !!item.href &&
    (item.href === "/" ? pathname === "/" : pathname.startsWith(item.href));

  return (
    <Link
      href={(item.href ?? "/") as never}
      onClick={onClose}
      className={cn(
        "flex items-center gap-2.5 rounded-lg py-2 text-sm font-medium transition-colors",
        depth === 0 ? "px-3" : "px-3 pl-8",
        isActive
          ? "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400"
          : "text-zinc-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-gray-800 hover:text-zinc-900 dark:hover:text-white"
      )}
    >
      <span className="text-base leading-none">{item.icon}</span>
      {t(item.labelKey)}
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
  // Auto-open if any child is active
  const isChildActive = item.children?.some(
    (c) => c.href && pathname.startsWith(c.href)
  );
  const [expanded, setExpanded] = useState(!!isChildActive);

  return (
    <div>
      <button
        onClick={() => setExpanded((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
          isChildActive
            ? "text-blue-700 dark:text-blue-400"
            : "text-zinc-600 dark:text-gray-400 hover:bg-zinc-100 dark:hover:bg-gray-800 hover:text-zinc-900 dark:hover:text-white"
        )}
      >
        <span className="text-base leading-none">{item.icon}</span>
        <span className="flex-1 text-left">{t(item.labelKey)}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 transition-transform duration-200",
            expanded ? "rotate-180" : ""
          )}
        />
      </button>

      {expanded && (
        <div className="mt-0.5 space-y-0.5 border-l-2 border-zinc-100 dark:border-gray-800 ml-5">
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
      )}
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
    NAV_ITEMS,
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
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden",
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
          "fixed top-0 left-0 z-50 h-full w-60 flex flex-col shadow-2xl",
          "bg-white dark:bg-gray-950 border-r border-zinc-200 dark:border-gray-800",
          "transition-transform duration-300 ease-in-out",
          "lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 dark:border-gray-800 px-5 shrink-0">
          <span className="text-lg font-bold text-zinc-900 dark:text-white">
            Club Fund
          </span>
          <button
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
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
          <p className="text-xs text-gray-400 dark:text-gray-600">
            © {new Date().getFullYear()} Club Fund. All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}

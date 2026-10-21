"use client";

import { useEffect, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import { usePathname } from "@/i18n/routing";

import { useAuth } from "@/domains/auth/hooks/useAuth";
import { cn } from "@/utils";

import { ADMIN_NAV_ITEMS, filterNav } from "./nav-config";
import { AdminSidebarHeader } from "@/components/admin/layout/AdminSidebarHeader";
import { AdminSidebarMain } from "@/components/admin/layout/AdminSidebarMain";
import { AdminSidebarFooter } from "@/components/admin/layout/AdminSidebarFooter";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const t = useTranslations("menu") as (key: string) => string;
  const pathname = usePathname() as string;

  const {
    user,
    hasPermission,
    isSuperAdmin,
    isSystemAdmin,
  } = useAuth();

  const sidebarRef = useRef<HTMLDivElement>(null);

  // ───────────────────────────────────────────────────────────────────────────
  // Role hiển thị
  // ───────────────────────────────────────────────────────────────────────────

  const sidebarRole = useMemo(() => {
    if (isSuperAdmin) {
      return {
        slug: "superadmin",
        name: "Super Admin",
      };
    }

    if (
      user?.roles &&
      !Array.isArray(user.roles) &&
      user.roles.global
    ) {
      return user.roles.global;
    }

    if (isSystemAdmin) {
      return {
        slug: "system_admin",
        name: "System Administrator",
      };
    }

    return null;
  }, [user?.roles, isSuperAdmin, isSystemAdmin]);

  // ───────────────────────────────────────────────────────────────────────────
  // Filter navigation
  // ───────────────────────────────────────────────────────────────────────────

  const filteredItems = useMemo(
    () =>
      filterNav(
        ADMIN_NAV_ITEMS,
        (module, action) =>
          hasPermission(module!, action!),
        isSuperAdmin || isSystemAdmin,
      ),
    [hasPermission, isSuperAdmin, isSystemAdmin],
  );

  // ───────────────────────────────────────────────────────────────────────────
  // Close sidebar khi click outside trên mobile
  // ───────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

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
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]",
          "transition-opacity duration-300 lg:hidden",
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 z-50 h-full w-[264px] flex flex-col",
          "bg-background border-r border-border",
          "shadow-[1px_0_0_0_rgba(0,0,0,0.04)]",
          "transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          "lg:relative lg:translate-x-0 lg:z-auto",
          "lg:shadow-none lg:sticky lg:top-0 lg:h-screen",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <AdminSidebarHeader
          role={sidebarRole}
          onClose={onClose}
        />

        <AdminSidebarMain
          items={filteredItems}
          pathname={pathname}
          onClose={onClose}
          t={t}
        />

        <AdminSidebarFooter />
      </aside>
    </>
  );
}
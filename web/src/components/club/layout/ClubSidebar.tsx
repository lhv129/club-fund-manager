'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/routing';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import { useClub } from '@/domains/club/hooks/useClub';
import { cn } from '@/utils';
import { ArrowLeft, ChevronDown, Sparkles, X } from 'lucide-react';
import { CLUB_NAV_ITEMS, filterNav, type NavItem } from './club-nav-config';
import { getTranslation } from '@/lib/translations';
import { APP_VERSION } from '@/lib/config';
import { APP_ROUTES } from '@/constants';
import ClubContextCard from './ClubContextCard';
import { SidebarCopyJoinLinkButton } from '@/components/club/layout/SidebarCopyJoinLinkButton';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ClubSidebarProps {
  open: boolean;
  onClose: () => void;
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
    if (item.href === '/') return pathname === '/';
    return item.exact
      ? pathname === item.href
      : pathname === item.href || pathname.startsWith(`${item.href}/`);
  }, [item.href, item.exact, pathname]);

  return (
    <div className="relative">
      {isActive && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[2.5px] -translate-y-1/2 rounded-full bg-primary"
        />
      )}

      <Link
        href={(item.href ?? '/') as never}
        onClick={onClose}
        aria-current={isActive ? 'page' : undefined}
        className={cn(
          'group flex items-center gap-2.5 rounded-lg text-sm transition-all duration-200 outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          depth === 0 ? 'px-3 py-2' : 'px-2.5 py-1.5',
          isActive
            ? 'bg-primary/10 text-primary font-semibold'
            : 'text-foreground-muted hover:bg-background-muted hover:text-foreground',
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-all duration-200',
            isActive
              ? 'text-primary'
              : 'text-foreground-muted group-hover:text-foreground',
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
    [item.children, pathname],
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
          'group w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 outline-none',
          'focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
          isChildActive
            ? 'text-foreground'
            : 'text-foreground-muted hover:bg-background-muted hover:text-foreground',
        )}
      >
        <Icon
          className={cn(
            'h-4 w-4 shrink-0 transition-all duration-200',
            isChildActive
              ? 'text-primary'
              : 'text-foreground-muted group-hover:text-foreground',
          )}
          strokeWidth={isChildActive ? 2.5 : 2}
        />
        <span className="flex-1 text-left truncate leading-tight">{t(item.labelKey)}</span>

        {isChildActive && (
          <span
            aria-hidden="true"
            className="w-1.5 h-1.5 rounded-full bg-primary shrink-0"
          />
        )}

        <ChevronDown
          aria-hidden="true"
          className={cn(
            'h-3.5 w-3.5 shrink-0 text-foreground-muted transition-transform duration-250 ease-out',
            expanded && 'rotate-180',
          )}
        />
      </button>

      <div
        className={cn(
          'grid transition-[grid-template-rows] duration-250 ease-out',
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="mt-1 ml-[22px] pl-3 py-0.5 border-l border-border space-y-0.5">
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
        ),
      )}
    </nav>
  );
});

// ─── ClubSidebarHeader ────────────────────────────────────────────────────────

const ClubSidebarHeader = memo(function ClubSidebarHeader({
  club,
  currentLocale,
  slug,
  isSuperAdmin,
  isSystemAdmin,
  onClose,
}: {
  club: ReturnType<typeof useClub>['club'];
  currentLocale: string;
  slug: string;
  isSuperAdmin: boolean;
  isSystemAdmin: boolean;
  onClose: () => void;
}) {
  return (
    <div className="h-16 flex items-center gap-2 px-4 lg:px-6 border-b border-border shrink-0">
      <ClubContextCard
        club={club}
        currentLocale={currentLocale}
        slug={slug}
        isSuperAdmin={isSuperAdmin}
        isSystemAdmin={isSystemAdmin}
      />

      <button
        aria-label="Close sidebar"
        onClick={onClose}
        className="lg:hidden rounded-lg p-1.5 text-foreground-muted hover:bg-background-muted hover:text-foreground transition-all duration-200 hover:rotate-90 shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

// ─── BackToClubsLink ──────────────────────────────────────────────────────────

function BackToClubsLink({
  href,
  onClick,
  label,
}: {
  href: string;
  onClick?: () => void;
  label: string;
}) {
  return (
    <Link
      href={href as never}
      onClick={onClick}
      className={cn(
        'group/back inline-flex items-center gap-1.5',
        'text-[11px] font-semibold uppercase tracking-wider',
        'text-foreground-muted hover:text-foreground',
        'transition-colors duration-200',
      )}
    >
      <ArrowLeft
        className="h-3.5 w-3.5 transition-transform duration-200 group-hover/back:-translate-x-0.5"
        strokeWidth={2.5}
      />
      {label}
    </Link>
  );
}

// ─── ClubSidebarFooter ────────────────────────────────────────────────────────

const ClubSidebarFooter = memo(function ClubSidebarFooter() {
  const t = useTranslations('app') as (key: string) => string;

  return (
    <div className="px-4 lg:px-6 py-4 border-t border-border shrink-0 space-y-2">
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-foreground-muted">{t('version')}</span>
        <span className="font-medium text-foreground">v{APP_VERSION}</span>
      </div>
      <div className="pt-1.5 border-t border-border">
        <p className="text-center text-[11px] text-foreground-muted">
          © {new Date().getFullYear()} {t('fullName')}
        </p>
      </div>
    </div>
  );
});

// ─── ClubSidebar (main) ───────────────────────────────────────────────────────

export function ClubSidebar({ open, onClose }: ClubSidebarProps) {
  const t = useTranslations('menu') as (key: string) => string;
  const tWorkspace = useTranslations('clubWorkspace') as (key: string) => string;
  const pathname = usePathname() as string;
  const currentLocale = useLocale() as string;

  const { hasPermission, isSuperAdmin, isSystemAdmin, hasMultipleClubs } = useAuth();
  const { club } = useClub();
  const sidebarRef = useRef<HTMLDivElement>(null);

  const slug =
    getTranslation(club?.translations, currentLocale)?.slug ??
    pathname.split('/')[2] ??
    String(club?.id ?? '');

  const canCreateInvite =
    isSuperAdmin ||
    isSystemAdmin ||
    hasPermission('club_invite', 'create', club?.id);

  const backHref = isSuperAdmin || isSystemAdmin ? APP_ROUTES.adminClubs : '/';
  const showBackToClubs = isSuperAdmin || isSystemAdmin || hasMultipleClubs;

  const filtered = useMemo(() => {
    if (!club) return [];
    const items = CLUB_NAV_ITEMS(slug);
    const clubCheck = (module?: string, action?: string) =>
      hasPermission(module!, action!, club.id) ||
      (isSystemAdmin && hasPermission(module!, action!));
    return filterNav(items, clubCheck, isSuperAdmin);
  }, [club, slug, hasPermission, isSuperAdmin, isSystemAdmin]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, onClose]);

  return (
    <>
      <div
        aria-hidden="true"
        className={cn(
          'fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={onClose}
      />

      <aside
        ref={sidebarRef}
        className={cn(
          'fixed top-0 left-0 z-50 h-full w-[264px] flex flex-col',
          'bg-background',
          'border-r border-border',
          'shadow-[1px_0_0_0_rgba(0,0,0,0.04)]',
          'transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'lg:relative lg:translate-x-0 lg:z-auto lg:shadow-none lg:sticky lg:top-0 lg:h-screen',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <ClubSidebarHeader
          club={club}
          currentLocale={currentLocale}
          slug={slug}
          isSuperAdmin={isSuperAdmin}
          isSystemAdmin={isSystemAdmin}
          onClose={onClose}
        />

        <div className="flex-1 flex flex-col overflow-y-auto">
          {(showBackToClubs || canCreateInvite) && (
            <div className="px-4 lg:px-5 pt-4 space-y-3">
              {showBackToClubs && (
                <BackToClubsLink
                  href={backHref}
                  onClick={onClose}
                  label={tWorkspace('backToClubs')}
                />
              )}
              {canCreateInvite && (
                <div>
                  <SidebarCopyJoinLinkButton slug={slug} />
                  <p className="mt-2 flex items-center justify-center gap-1 text-[10px] text-foreground-muted">
                    <Sparkles className="h-3 w-3" strokeWidth={2} />
                    {tWorkspace('inviteLinkHint')}
                  </p>
                </div>
              )}
            </div>
          )}

          <SidebarNav items={filtered} pathname={pathname} onClose={onClose} t={t} />
        </div>

        <ClubSidebarFooter />
      </aside>
    </>
  );
}

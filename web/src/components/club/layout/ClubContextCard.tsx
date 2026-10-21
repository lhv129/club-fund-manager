'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Shield, User } from 'lucide-react';
import { cn } from '@/utils';
import { getTranslation } from '@/lib/translations';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import type { Club } from '@/domains/club/types';
import CustomImage from '@/components/shared/media/CustomImage';

/* ------------------------------------------------------------------ */
/* Types */
/* ------------------------------------------------------------------ */

type RoleLevel = 'super-admin' | 'system-admin' | 'member';

export interface ClubContextCardProps {
    club: Club | null;
    currentLocale: string;
    slug: string;
    isSuperAdmin: boolean;
    isSystemAdmin: boolean;
}

interface RoleConfig {
    level: RoleLevel;
    icon: typeof Crown;
    labelKey: 'viewingAsSuperAdmin' | 'viewingAsSystemAdmin' | 'memberRole';
    badge: string;
    iconColor: string;
}

/* ------------------------------------------------------------------ */
/* System role config */
/* ------------------------------------------------------------------ */

const ROLE_CONFIG: Record<RoleLevel, RoleConfig> = {
    'super-admin': {
        level: 'super-admin',
        icon: Crown,
        labelKey: 'viewingAsSuperAdmin',
        badge: 'bg-amber-50/80 dark:bg-amber-500/[0.08] border-amber-200/60 dark:border-amber-500/20 text-amber-700 dark:text-amber-300',
        iconColor: 'text-amber-500 dark:text-amber-400',
    },
    'system-admin': {
        level: 'system-admin',
        icon: Shield,
        labelKey: 'viewingAsSystemAdmin',
        badge: 'bg-blue-50/80 dark:bg-blue-500/[0.08] border-blue-200/60 dark:border-blue-500/20 text-blue-700 dark:text-blue-300',
        iconColor: 'text-blue-500 dark:text-blue-400',
    },
    member: {
        level: 'member',
        icon: User,
        labelKey: 'memberRole',
        badge: 'bg-background-muted/80 border-border text-foreground-muted',
        iconColor: 'text-foreground-muted',
    },
};

/* ------------------------------------------------------------------ */
/* Club role colors */
/* ------------------------------------------------------------------ */

const CLUB_ROLE_COLORS: Record<string, { badge: string; iconColor: string }> = {
    owner: {
        badge: 'bg-amber-50/80 dark:bg-amber-500/[0.08] border-amber-200/60 dark:border-amber-500/20 text-amber-700 dark:text-amber-300',
        iconColor: 'text-amber-500 dark:text-amber-400',
    },
    admin: {
        badge: 'bg-blue-50/80 dark:bg-blue-500/[0.08] border-blue-200/60 dark:border-blue-500/20 text-blue-700 dark:text-blue-300',
        iconColor: 'text-blue-500 dark:text-blue-400',
    },
    manager: {
        badge: 'bg-violet-50/80 dark:bg-violet-500/[0.08] border-violet-200/60 dark:border-violet-500/20 text-violet-700 dark:text-violet-300',
        iconColor: 'text-violet-500 dark:text-violet-400',
    },
    moderator: {
        badge: 'bg-cyan-50/80 dark:bg-cyan-500/[0.08] border-cyan-200/60 dark:border-cyan-500/20 text-cyan-700 dark:text-cyan-300',
        iconColor: 'text-cyan-500 dark:text-cyan-400',
    },
    editor: {
        badge: 'bg-emerald-50/80 dark:bg-emerald-500/[0.08] border-emerald-200/60 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-300',
        iconColor: 'text-emerald-500 dark:text-emerald-400',
    },
    member: {
        badge: 'bg-background-muted/80 border-border text-foreground-muted',
        iconColor: 'text-foreground-muted',
    },
};

function resolveRole(isSuperAdmin: boolean, isSystemAdmin: boolean): RoleConfig {
    if (isSuperAdmin) return ROLE_CONFIG['super-admin'];
    if (isSystemAdmin) return ROLE_CONFIG['system-admin'];
    return ROLE_CONFIG.member;
}

/* ------------------------------------------------------------------ */
/* Avatar */
/* ------------------------------------------------------------------ */

function ClubAvatar({ name, logoUrl, size = 36 }: { name?: string; logoUrl?: string; size?: number }) {
    const [imgError, setImgError] = useState(false);
    const monogram = (name?.trim()?.[0] ?? '?').toUpperCase();

    return (
        <div className="relative shrink-0 overflow-hidden rounded-lg ring-1 ring-border shadow-sm" style={{ width: size, height: size }}>
            {logoUrl && !imgError ? (
                <CustomImage src={logoUrl} alt={name ?? 'Club'} className="h-full w-full object-cover" onError={() => setImgError(true)} />
            ) : (
                <div className="flex h-full w-full select-none items-center justify-center bg-gradient-to-br from-background-muted to-background-muted font-semibold text-foreground" style={{ fontSize: size * 0.42 }}>
                    {monogram}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Skeleton */
/* ------------------------------------------------------------------ */

function ClubContextCardSkeleton() {
    return (
        <div className="flex min-w-0 flex-1 items-center gap-2.5 animate-pulse">
            <div className="h-9 w-9 shrink-0 rounded-lg bg-background-muted ring-1 ring-border" />
            <div className="min-w-0 flex-1">
                <div className="h-3.5 w-24 max-w-full rounded bg-background-muted" />
            </div>
            <div className="hidden h-6 w-20 shrink-0 rounded-full bg-background-muted sm:block" />
        </div>
    );
}

/* ------------------------------------------------------------------ */
/* Main card */
/* ------------------------------------------------------------------ */

const ClubContextCard = memo(function ClubContextCard({
    club,
    currentLocale,
    slug,
    isSuperAdmin,
    isSystemAdmin,
}: ClubContextCardProps) {
    const tWorkspace = useTranslations('clubWorkspace') as (key: string) => string;
    const { getClubRole } = useAuth();

    if (!club) return <ClubContextCardSkeleton />;

    const tr = getTranslation(club.translations, currentLocale);
    const clubName = tr?.name;
    const clubLogoUrl = club.logo ?? undefined;
    const clubRole = getClubRole(club.id);
    const role = resolveRole(isSuperAdmin, isSystemAdmin);

    const roleColors = role.level === 'member'
        ? CLUB_ROLE_COLORS[clubRole?.slug ?? 'member'] ?? CLUB_ROLE_COLORS.member
        : { badge: role.badge, iconColor: role.iconColor };

    const roleLabel = role.level === 'member' && clubRole?.name ? clubRole.name : tWorkspace(role.labelKey);
    const RoleIcon = role.icon;

    return (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <ClubAvatar name={clubName} logoUrl={clubLogoUrl} size={36} />

            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-foreground" title={clubName}>
                    {clubName ?? '—'}
                </p>
            </div>

            <span role="status" className={cn(
                'hidden shrink-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium sm:inline-flex',
                'transition-colors duration-200',
                roleColors.badge,
            )}>
                <RoleIcon className={cn('h-3 w-3 shrink-0', roleColors.iconColor)} strokeWidth={2} />
                <span className="max-w-[120px] truncate">{roleLabel}</span>
            </span>
        </div>
    );
});

export default ClubContextCard;
'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Shield, User } from 'lucide-react';
import { cn } from '@/utils';
import { getTranslation } from '@/lib/translations';
import type { Club } from '@/domains/club/types';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type RoleLevel = 'super-admin' | 'system-admin' | 'member';

export interface ClubContextCardProps {
    club: Club | null;
    currentLocale: string;
    slug: string;
    isSuperAdmin: boolean;
    isSystemAdmin: boolean;
}

/* ------------------------------------------------------------------ */
/*  Role config — icon + badge + accent, premium muted palette         */
/* ------------------------------------------------------------------ */

interface RoleConfig {
    level: RoleLevel;
    icon: typeof Crown;
    labelKey: 'viewingAsSuperAdmin' | 'viewingAsSystemAdmin' | 'memberRole';
    badge: string;
    dot: string;
    accentText: string;
    ring: string;
}

const ROLE_CONFIG: Record<RoleLevel, RoleConfig> = {
    'super-admin': {
        level: 'super-admin',
        icon: Crown,
        labelKey: 'viewingAsSuperAdmin',
        badge:
            'bg-amber-50/80 dark:bg-amber-500/[0.08] border-amber-200/60 dark:border-amber-500/20 text-amber-700 dark:text-amber-300',
        dot: 'bg-amber-500 dark:bg-amber-400',
        accentText: 'text-amber-600 dark:text-amber-400',
        ring: 'ring-amber-500/20',
    },
    'system-admin': {
        level: 'system-admin',
        icon: Shield,
        labelKey: 'viewingAsSystemAdmin',
        badge:
            'bg-blue-50/80 dark:bg-blue-500/[0.08] border-blue-200/60 dark:border-blue-500/20 text-blue-700 dark:text-blue-300',
        dot: 'bg-blue-500 dark:bg-blue-400',
        accentText: 'text-blue-600 dark:text-blue-400',
        ring: 'ring-blue-500/20',
    },
    member: {
        level: 'member',
        icon: User,
        labelKey: 'memberRole',
        badge:
            'bg-background-muted/80 border-border text-foreground-muted',
        dot: 'bg-foreground-muted',
        accentText: 'text-foreground-muted',
        ring: 'ring-foreground-muted/20',
    },
};

function resolveRole(isSuperAdmin: boolean, isSystemAdmin: boolean): RoleConfig {
    if (isSuperAdmin) return ROLE_CONFIG['super-admin'];
    if (isSystemAdmin) return ROLE_CONFIG['system-admin'];
    return ROLE_CONFIG.member;
}

/* ------------------------------------------------------------------ */
/*  Avatar — logo image or monogram fallback                          */
/* ------------------------------------------------------------------ */

function ClubAvatar({
    name,
    logoUrl,
    size = 36,
}: {
    name?: string;
    logoUrl?: string;
    size?: number;
}) {
    const [imgError, setImgError] = useState(false);
    const monogram = (name?.trim()?.[0] ?? '?').toUpperCase();

    return (
        <div
            className="relative shrink-0 rounded-lg overflow-hidden ring-1 ring-border shadow-sm"
            style={{ width: size, height: size }}
        >
            {logoUrl && !imgError ? (
                <img
                    src={logoUrl}
                    alt={name ?? 'Club'}
                    className="h-full w-full object-cover"
                    onError={() => setImgError(true)}
                />
            ) : (
                <div
                    className="flex h-full w-full items-center justify-center bg-gradient-to-br from-background-muted to-background-muted text-foreground font-semibold select-none"
                    style={{ fontSize: size * 0.42 }}
                >
                    {monogram}
                </div>
            )}
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Main card — compact, fits h-16 header                              */
/* ------------------------------------------------------------------ */

const ClubContextCard = memo(function ClubContextCard({
    club,
    currentLocale,
    slug,
    isSuperAdmin,
    isSystemAdmin,
}: ClubContextCardProps) {
    const tWorkspace = useTranslations('clubWorkspace') as (key: string) => string;

    const tr = getTranslation(club?.translations, currentLocale);
    const clubName = tr?.name;
    const clubLogoUrl = club?.logo ?? undefined;
    const roleName = club?.role?.translation?.name ?? undefined;

    const role = resolveRole(isSuperAdmin, isSystemAdmin);
    const roleLabel =
        role.level === 'member' && roleName ? roleName : tWorkspace(role.labelKey);
    const RoleIcon = role.icon;

    return (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <ClubAvatar name={clubName} logoUrl={clubLogoUrl} size={36} />

            <div className="min-w-0 flex-1">
                <p
                    className="truncate text-sm font-semibold leading-tight text-foreground"
                    title={clubName}
                >
                    {clubName ?? '—'}
                </p>
                {/* <p className="truncate text-xs leading-tight text-foreground-muted">
                    {tr?.description || `/${slug}`}
                </p> */}
            </div>

            {/* Role badge — hidden on mobile to keep h-16 clean, shown from sm up */}
            <span
                role="status"
                className={cn(
                    'hidden sm:inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-medium shrink-0',
                    'transition-colors duration-200',
                    role.badge,
                )}
            >
                <RoleIcon className="h-3 w-3 shrink-0" strokeWidth={2} />
                <span className="max-w-[120px] truncate">{roleLabel}</span>
            </span>
        </div>
    );
});

export default ClubContextCard;

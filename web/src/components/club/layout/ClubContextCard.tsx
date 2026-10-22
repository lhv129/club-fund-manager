
'use client';

import { memo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Crown, Shield, User } from 'lucide-react';
import { cn } from '@/utils';
import { getTranslation } from '@/lib/translations';
import { useAuth } from '@/domains/auth/hooks/useAuth';
import type { Club } from '@/domains/club/types';
import CustomImage from '@/components/shared/media/CustomImage';

type RoleLevel = 'super-admin' | 'system-admin' | 'club' | 'member';

export interface ClubContextCardProps {
    club: Club | null;
    currentLocale: string;
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

const GLOBAL_ROLE_CONFIG: Record<'super-admin' | 'system-admin', RoleConfig> = {
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
};

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

function getClubRoleIcon(slug?: string) {
    switch (slug) {
        case 'owner': return Crown;
        case 'admin': return Shield;
        case 'manager':
        case 'moderator':
        case 'editor': return User;
        default: return User;
    }
}

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

function ClubContextCardSkeleton() {
    return (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-background-muted ring-1 ring-border" />
            <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-3.5 w-28 max-w-full animate-pulse rounded bg-background-muted" />
                <div className="h-5 w-20 animate-pulse rounded-full bg-background-muted" />
            </div>
        </div>
    );
}

function RoleBadge({ icon: RoleIcon, label, badge, iconColor }: { icon: typeof Crown; label: string; badge: string; iconColor: string }) {
    return (
        <span role="status" className={cn('inline-flex max-w-full items-center gap-1.5', 'w-fit shrink-0 rounded-full border px-2 py-1', 'text-[11px] font-medium transition-colors duration-200', badge)}>
            <RoleIcon className={cn('h-3 w-3 shrink-0', iconColor)} strokeWidth={2} />
            <span className="max-w-[140px] truncate">{label}</span>
        </span>
    );
}

const ClubContextCard = memo(function ClubContextCard({ club, currentLocale, isSuperAdmin, isSystemAdmin }: ClubContextCardProps) {
    const tWorkspace = useTranslations('clubWorkspace') as (key: string) => string;
    const { getClubRole, getGlobalRole } = useAuth();

    if (!club) return <ClubContextCardSkeleton />;

    const tr = getTranslation(club.translations, currentLocale);
    const clubName = tr?.name;
    const clubLogoUrl = club.logo ?? undefined;
    const clubRole = getClubRole(club.id);
    const globalRole = getGlobalRole();

    let roleIcon: typeof Crown = User;
    let roleLabel = tWorkspace('memberRole');
    let roleBadge = CLUB_ROLE_COLORS.member.badge;
    let roleIconColor = CLUB_ROLE_COLORS.member.iconColor;

    if (isSuperAdmin) {
        const config = GLOBAL_ROLE_CONFIG['super-admin'];
        roleIcon = config.icon;
        roleLabel = globalRole?.name ?? globalRole?.slug ?? tWorkspace(config.labelKey);
        roleBadge = config.badge;
        roleIconColor = config.iconColor;
    } else if (isSystemAdmin) {
        const config = GLOBAL_ROLE_CONFIG['system-admin'];
        roleIcon = config.icon;
        roleLabel = globalRole?.name ?? globalRole?.slug ?? tWorkspace(config.labelKey);
        roleBadge = config.badge;
        roleIconColor = config.iconColor;
    } else if (clubRole) {
        roleIcon = getClubRoleIcon(clubRole.slug);
        roleLabel = clubRole.name ?? clubRole.slug ?? tWorkspace('memberRole');
        const colors = CLUB_ROLE_COLORS[clubRole.slug] ?? CLUB_ROLE_COLORS.member;
        roleBadge = colors.badge;
        roleIconColor = colors.iconColor;
    } else if (globalRole) {
        const isSuperAdminRole = globalRole.slug === 'superadmin';
        const config = isSuperAdminRole ? GLOBAL_ROLE_CONFIG['super-admin'] : GLOBAL_ROLE_CONFIG['system-admin'];
        roleIcon = config.icon;
        roleLabel = globalRole.name ?? globalRole.slug ?? tWorkspace(config.labelKey);
        roleBadge = config.badge;
        roleIconColor = config.iconColor;
    }

    return (
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <ClubAvatar name={clubName} logoUrl={clubLogoUrl} size={40} />
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold leading-tight text-foreground" title={clubName}>
                    {clubName ?? '—'}
                </p>
                <div className="mt-1">
                    <RoleBadge icon={roleIcon} label={roleLabel} badge={roleBadge} iconColor={roleIconColor} />
                </div>
            </div>
        </div>
    );
});

export default ClubContextCard;

import { ArrowRight, Loader2 } from "lucide-react";
import { ClubLogo } from "./ClubLogo";
import { ClubStatusBadge } from "./ClubStatusBadge";
import { ClubMenuButton } from "./ClubMenuButton";
import { ClubMeta } from "./ClubMeta";
import { useState } from "react";

export interface ClubCardData {
    id: number;
    name: string;
    description?: string | null;
    logo?: string | null;
    isActive: boolean;
    memberCount: number;
    /** Tên vai trò hiển thị — đã dịch (owner → "Chủ CLB", ...) */
    role?: string;
}

export interface ClubCardLabels {
    active: string;
    inactive: string;
    members: string;
    role: string;
    openWorkspace: string;
    noDescription: string;
    toggleActive: string;
    toggleInactive: string;
    menu: {
        edit: string;
        members: string;
        settings: string;
        disband: string;
    };
}

interface ClubCardProps {
    club: ClubCardData;
    labels: ClubCardLabels;
    canUpdate?: boolean;
    canDelete?: boolean;
    /** Toggle is_active đang chạy */
    isToggling?: boolean;
    onOpen?: (id: number) => void;
    onEdit?: (id: number) => void;
    onToggle?: (id: number) => void;
    onMembers?: (id: number) => void;
    onSettings?: (id: number) => void;
    /** Giải tán CLB === delete — mở DeleteConfirmModal ở cha */
    onDisband?: (id: number) => void;
}


const MAX_LENGTH = 300;

export function ClubDescription({ description }: { description?: string | null }) {
    const [expanded, setExpanded] = useState(false);

    if (!description) {
        return (
            <p className="text-gray-300 dark:text-gray-600 italic">
                Chưa có mô tả
            </p>
        );
    }

    const needCollapse = description.length > MAX_LENGTH;

    const html = expanded || !needCollapse
        ? description
        : description.slice(0, MAX_LENGTH) + "...";

    return (
        <div className="text-[13px] leading-relaxed text-gray-500 dark:text-gray-400">
            <div
                dangerouslySetInnerHTML={{ __html: html }}
            />

            {needCollapse && (
                <button
                    type="button"
                    onClick={() => setExpanded(!expanded)}
                    className="mt-1 text-indigo-600 hover:underline"
                >
                    {expanded ? "Thu gọn" : "Xem thêm"}
                </button>
            )}
        </div>
    );
}

/**
 * ClubCard — card đơn cho một CLB.
 *
 * Layout (top → bottom):
 *   [Logo]  Tên CLB                          [● Status / toggle]  [⋮]
 *   Mô tả CLB (line-clamp 2)
 *   👥 N thành viên  |  👤 Vai trò: X
 *   ──────────────────────────────────────────────────────────────────
 *   [              Vào câu lạc bộ →              ]
 *
 * Khi canUpdate=true, status badge có thể click để toggle is_active.
 */
export function ClubCard({
    club,
    labels,
    canUpdate = false,
    canDelete = false,
    isToggling = false,
    onOpen,
    onEdit,
    onToggle,
    onMembers,
    onSettings,
    onDisband,
}: ClubCardProps) {
    const showMenu = canUpdate || canDelete;

    return (
        <div
            className="group flex flex-col bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-800
        rounded-2xl overflow-hidden
        shadow-sm hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700
        transition-all duration-200"
        >
            {/* ── Card body ──────────────────────────────────────────────── */}
            <div className="flex flex-col gap-3.5 px-5 pt-5 pb-4 flex-1">

                {/* Row 1: Logo + name + status/toggle + menu */}
                <div className="flex items-start gap-3">
                    <ClubLogo src={club.logo} name={club.name} size="md" />

                    <div className="flex-1 min-w-0 pt-0.5 space-y-1.5">
                        <h3 className="text-[15px] font-semibold text-gray-900 dark:text-white
              leading-snug line-clamp-1 pr-1">
                            {club.name}
                        </h3>

                        {/* Status: click để toggle nếu có quyền update */}
                        {canUpdate && onToggle ? (
                            <button
                                type="button"
                                onClick={() => !isToggling && onToggle(club.id)}
                                disabled={isToggling}
                                title={club.isActive ? labels.toggleInactive : labels.toggleActive}
                                className="group/toggle flex items-center gap-1.5 disabled:cursor-wait"
                                aria-label={club.isActive ? labels.toggleInactive : labels.toggleActive}
                            >
                                {isToggling ? (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5
                    rounded-full text-xs font-medium
                    bg-gray-100 text-gray-400 ring-1 ring-gray-200/80
                    dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-700/80">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        {club.isActive ? labels.active : labels.inactive}
                                    </span>
                                ) : (
                                    <span className="group-hover/toggle:opacity-80 transition-opacity">
                                        <ClubStatusBadge
                                            isActive={club.isActive}
                                            labelActive={labels.active}
                                            labelInactive={labels.inactive}
                                        />
                                    </span>
                                )}
                            </button>
                        ) : (
                            <ClubStatusBadge
                                isActive={club.isActive}
                                labelActive={labels.active}
                                labelInactive={labels.inactive}
                            />
                        )}
                    </div>

                    {showMenu && (
                        <ClubMenuButton
                            labels={labels.menu}
                            canUpdate={canUpdate}
                            canDelete={canDelete}
                            onEdit={() => onEdit?.(club.id)}
                            onMembers={() => onMembers?.(club.id)}
                            onSettings={() => onSettings?.(club.id)}
                            onDisband={() => onDisband?.(club.id)}
                        />
                    )}
                </div>

                {/* Row 2: Description */}
                <ClubDescription description={club.description} />

                {/* Row 3: Meta */}
                <ClubMeta
                    memberCount={club.memberCount}
                    role={club.role}
                    labelMembers={labels.members}
                    labelRole={labels.role}
                />
            </div>

            {/* ── Footer CTA ──────────────────────────────────────────────── */}
            <div className="border-t border-gray-100 dark:border-gray-800">
                <button
                    type="button"
                    onClick={() => onOpen?.(club.id)}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-5
            text-[13px] font-medium
            text-indigo-600 dark:text-indigo-400
            hover:bg-indigo-50 dark:hover:bg-indigo-950/40
            transition-colors"
                >
                    {labels.openWorkspace}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform duration-150
            group-hover:translate-x-0.5" />
                </button>
            </div>
        </div>
    );
}

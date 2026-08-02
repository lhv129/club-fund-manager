import { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Pencil, Users, Settings, ShieldOff } from "lucide-react";

interface Labels {
    edit: string;
    members: string;
    settings: string;
    disband: string;
}

interface ClubMenuButtonProps {
    labels: Labels;
    canUpdate?: boolean;
    canDelete?: boolean;
    onEdit?: () => void;
    onMembers?: () => void;
    onSettings?: () => void;
    /** Giải tán CLB — equals delete. Hiện DeleteConfirmModal ở cha. */
    onDisband?: () => void;
}

/**
 * Nút ⋮ — dropdown các thao tác quản trị CLB.
 * "Giải tán" (Disband) === delete — gọi onDisband để cha mở DeleteConfirmModal.
 * Labels được truyền từ cha để tương thích useTranslations.
 */
export function ClubMenuButton({
    labels,
    canUpdate = true,
    canDelete = true,
    onEdit,
    onMembers,
    onSettings,
    onDisband,
}: ClubMenuButtonProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", close);
        return () => document.removeEventListener("mousedown", close);
    }, [open]);

    // Đóng dropdown khi nhấn Escape
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open]);

    type Item = {
        show: boolean;
        icon: React.ReactNode;
        label: string;
        onClick: () => void;
        danger?: boolean;
        dividerBefore?: boolean;
    };

    const items: Item[] = [
        {
            show: canUpdate,
            icon: <Pencil className="w-3.5 h-3.5" />,
            label: labels.edit,
            onClick: () => { onEdit?.(); setOpen(false); },
        },
        {
            show: true,
            icon: <Users className="w-3.5 h-3.5" />,
            label: labels.members,
            onClick: () => { onMembers?.(); setOpen(false); },
        },
        {
            show: true,
            icon: <Settings className="w-3.5 h-3.5" />,
            label: labels.settings,
            onClick: () => { onSettings?.(); setOpen(false); },
        },
        {
            show: canDelete,
            icon: <ShieldOff className="w-3.5 h-3.5" />,
            label: labels.disband,
            onClick: () => { onDisband?.(); setOpen(false); },
            danger: true,
            dividerBefore: true,
        },
    ].filter((i) => i.show);

    if (items.length === 0) return null;

    return (
        <div ref={ref} className="relative shrink-0">
            <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
                className={`w-7 h-7 flex items-center justify-center rounded-lg
          transition-colors
          ${open
                        ? "text-gray-600 bg-gray-100 dark:text-gray-300 dark:bg-white/8"
                        : "text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:text-gray-300 dark:hover:bg-white/8"
                    }`}
                aria-label="Tùy chọn"
                aria-expanded={open}
            >
                <MoreHorizontal className="w-4 h-4" />
            </button>

            {open && (
                <div
                    className="absolute right-0 top-8 z-50 min-w-[168px]
            bg-white dark:bg-gray-900
            border border-gray-200 dark:border-gray-700
            rounded-xl shadow-lg shadow-black/8
            py-1 overflow-hidden"
                    role="menu"
                >
                    {items.map((item, idx) => (
                        <div key={item.label}>
                            {item.dividerBefore && idx > 0 && (
                                <div className="my-1 border-t border-gray-100 dark:border-gray-800" />
                            )}
                            <button
                                type="button"
                                onClick={item.onClick}
                                role="menuitem"
                                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[13px] font-medium
                  transition-colors text-left
                  ${item.danger
                                        ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                    }`}
                            >
                                {item.icon}
                                {item.label}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

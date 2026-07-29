interface ClubStatusBadgeProps {
    isActive: boolean;
    /** t("active") / t("inactive") từ namespace common */
    labelActive: string;
    labelInactive: string;
}

/** ● Đang hoạt động / ● Ngừng hoạt động */
export function ClubStatusBadge({ isActive, labelActive, labelInactive }: ClubStatusBadgeProps) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap
        ${isActive
                    ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-800/60"
                    : "bg-gray-100 text-gray-500 ring-1 ring-gray-200/80 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700/80"
                }`}
        >
            <span
                className={`w-1.5 h-1.5 rounded-full shrink-0
          ${isActive
                        ? "bg-emerald-500 shadow-[0_0_0_2px_rgba(16,185,129,0.2)]"
                        : "bg-gray-400 dark:bg-gray-500"
                    }`}
            />
            {isActive ? labelActive : labelInactive}
        </span>
    );
}

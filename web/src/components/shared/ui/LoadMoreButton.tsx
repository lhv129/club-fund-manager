import { Loader2, ChevronDown } from "lucide-react";

interface LoadMoreButtonProps {
    onClick: () => void;
    loading: boolean;
    /** t("loadMore") — "Tải thêm" */
    label: string;
    /** t("loading") — "Đang tải..." */
    loadingLabel: string;
    /** t("loadMoreCount", { count }) — "Tải thêm (còn N câu lạc bộ)" */
    remainingLabel?: string;
}

/**
 * Nút "Tải thêm" — dùng ở cuối danh sách CLB.
 * Labels truyền từ cha để tương thích useTranslations.
 */
export function LoadMoreButton({
    onClick,
    loading,
    label,
    loadingLabel,
    remainingLabel,
}: LoadMoreButtonProps) {
    return (
        <div className="flex flex-col items-center gap-2 pt-2">
            {remainingLabel && !loading && (
                <p className="text-xs text-gray-400 dark:text-gray-500">{remainingLabel}</p>
            )}
            <button
                type="button"
                onClick={onClick}
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5
          text-sm font-medium rounded-xl
          border border-gray-200 dark:border-gray-700
          text-gray-600 dark:text-gray-300
          bg-white dark:bg-gray-900
          hover:bg-gray-50 dark:hover:bg-gray-800
          hover:border-gray-300 dark:hover:border-gray-600
          disabled:opacity-60 disabled:cursor-not-allowed
          transition-all duration-150 shadow-sm"
            >
                {loading ? (
                    <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        {loadingLabel}
                    </>
                ) : (
                    <>
                        <ChevronDown className="w-4 h-4" />
                        {label}
                    </>
                )}
            </button>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search, RotateCcw, ArrowUpDown, Loader2 } from "lucide-react";
import SelectDropdown, { SelectOption } from "./SelectDropdown";

export interface SortOption {
    value: string;
    label: string;
}

export interface AppliedFilters {
    search: string;
    is_active?: 0 | 1;
    sort_by?: string;
    sort_dir?: "asc" | "desc";
}

interface FilterBarProps {
    /** Giá trị ĐÃ ÁP DỤNG (đang thật sự dùng để gọi API) — chỉ dùng để khởi tạo/đồng bộ lại draft, không bind trực tiếp vào input. */
    search: string;
    isActive?: 0 | 1;
    sortBy?: string;
    sortDir?: "asc" | "desc";
    sortOptions: SortOption[];
    showStatusFilter?: boolean;
    searchPlaceholder?: string;
    /** Disable nút "Tìm kiếm" + hiện spinner khi đang gọi API. */
    loading?: boolean;

    /**
     * Gọi API + sync params — CHỈ chạy khi bấm nút "Tìm kiếm" hoặc nhấn Enter
     * trong ô search. Thay đổi search/status/sort chỉ cập nhật DRAFT cục bộ,
     * không tự gọi API.
     */
    onApply: (filters: AppliedFilters) => void;
    onReset: () => void;

    /** Slot cho filter riêng theo từng page (ví dụ: theo club, theo category...) */
    extraFilters?: React.ReactNode;

    className?: string;
}

export function FilterBar({
    search,
    isActive,
    sortBy,
    sortDir = "desc",
    sortOptions,
    showStatusFilter = true,
    searchPlaceholder,
    loading = false,
    onApply,
    onReset,
    extraFilters,
    className = "",
}: FilterBarProps) {
    const t = useTranslations("common");

    // ── Draft — thay đổi ở đây KHÔNG gọi API, chỉ khi bấm "Tìm kiếm" mới apply ──
    const [draftSearch, setDraftSearch] = useState(search);
    const [draftIsActive, setDraftIsActive] = useState<0 | 1 | undefined>(isActive);
    const [draftSortBy, setDraftSortBy] = useState(sortBy);
    const [draftSortDir, setDraftSortDir] = useState<"asc" | "desc">(sortDir);

    // Đồng bộ lại draft khi giá trị ĐÃ APPLY từ parent đổi — do bấm Reset, do
    // load lại từ URL, hoặc do bấm nút Back/Forward của browser (params đổi qua
    // popstate). Không chạy khi user tự gõ/chọn (đó là setDraft* ở trên).
    useEffect(() => setDraftSearch(search), [search]);
    useEffect(() => setDraftIsActive(isActive), [isActive]);
    useEffect(() => setDraftSortBy(sortBy), [sortBy]);
    useEffect(() => setDraftSortDir(sortDir), [sortDir]);

    const statusOptions: SelectOption[] = [
        { value: "1", label: t("active") },
        { value: "0", label: t("inactive") },
    ];

    const sortSelectOptions: SelectOption[] = sortOptions.map((opt) => ({
        value: opt.value,
        label: opt.label,
    }));

    const handleApply = () =>
        onApply({
            search: draftSearch,
            is_active: draftIsActive,
            sort_by: draftSortBy,
            sort_dir: draftSortDir,
        });

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleApply();
        }
    };

    return (
        <div
            className={`flex flex-wrap items-end gap-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl px-4 py-3.5 ${className}`}
        >
            {/* Search input */}
            <div className="flex flex-col gap-1 flex-1 min-w-56">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("search")}
                </span>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                        value={draftSearch}
                        onChange={(e) => setDraftSearch(e.target.value)}
                        onKeyDown={handleSearchKeyDown}
                        placeholder={searchPlaceholder ?? t("searchPlaceholder")}
                        className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                    />
                </div>
            </div>

            {/* Status (is_active) */}
            {showStatusFilter && (
                <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {t("status")}
                    </span>
                    <SelectDropdown
                        label={t("status")}
                        options={statusOptions}
                        value={draftIsActive === undefined ? "" : String(draftIsActive)}
                        onChange={(v) =>
                            setDraftIsActive(v === "" ? undefined : (Number(v) as 0 | 1))
                        }
                        placeholder={t("all")}
                    />
                </div>
            )}

            {/* Sort by */}
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("sortBy")}
                </span>
                <SelectDropdown
                    label={t("sortBy")}
                    options={sortSelectOptions}
                    value={draftSortBy ?? ""}
                    onChange={(v) => setDraftSortBy(v || sortOptions[0]?.value)}
                    placeholder={sortOptions[0]?.label}
                />
            </div>

            {/* Order — component cũ (button + icon đảo asc/desc), chỉ đổi draft */}
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {t("sortDir")}
                </span>
                <button
                    type="button"
                    onClick={() => setDraftSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                    className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    {draftSortDir === "asc" ? t("sortAsc") : t("sortDesc")}
                </button>
            </div>

            {/* Extra filters riêng theo từng page */}
            {extraFilters}

            {/* Reset */}
            <button
                type="button"
                onClick={onReset}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                title={t("reset")}
            >
                <RotateCcw className="w-3.5 h-3.5" />
                {t("reset")}
            </button>

            {/* Tìm kiếm — nằm SAU Reset và Order, là control DUY NHẤT gọi API */}
            <button
                type="button"
                onClick={handleApply}
                disabled={loading}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700
                    disabled:opacity-60 text-white text-sm font-medium transition-colors shrink-0"
            >
                {loading
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Search className="w-4 h-4" />}
                {t("searchButton")}
            </button>
        </div>
    );
}

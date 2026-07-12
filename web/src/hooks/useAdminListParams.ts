"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

export type BaseListParams = {
    limit: number;
    page: number;
    sort_by?: string;
    sort_dir?: "asc" | "desc";
};

/** Giá trị filter chỉ chấp nhận string | number | undefined để serialize URL an toàn. */
export type FilterValue = string | number | undefined;

export type AdminListParams<TFilters extends Record<string, FilterValue>> =
    BaseListParams & TFilters;

interface UseAdminListParamsOptions<TFilters extends Record<string, FilterValue>> {
    /** Shape + giá trị mặc định của filter riêng từng module. */
    defaultFilters: TFilters;
    /** Key của field free-text search cần debounce tự động. Bỏ qua nếu module dùng nút Tìm kiếm riêng. */
    searchKey?: keyof TFilters;
    defaultLimit?: number;
    defaultSortBy?: string;
    defaultSortDir?: "asc" | "desc";
    /** Đồng bộ params lên URL (replaceState). Mặc định true. */
    syncToUrl?: boolean;
}

const DEBOUNCE_MS = 400;

type ParamReader = { get(key: string): string | null };

export function useAdminListParams<TFilters extends Record<string, FilterValue>>(
    options: UseAdminListParamsOptions<TFilters>
) {
    const {
        defaultFilters,
        searchKey,
        defaultLimit = 10,
        defaultSortBy,
        defaultSortDir = "desc",
        syncToUrl = true,
    } = options;

    // Chỉ đọc URL lần đầu để khởi tạo state (SSR-safe).
    const initialSearchParams = useSearchParams();
    const filterKeys = Object.keys(defaultFilters) as (keyof TFilters)[];

    // ─── Parse URL → params ───────────────────────────────────────────────────────

    const parseParams = useCallback((sp: ParamReader): AdminListParams<TFilters> => {
        const base: BaseListParams = syncToUrl
            ? {
                limit: Number(sp.get("limit")) || defaultLimit,
                page: Number(sp.get("page")) || 1,
                sort_by: sp.get("sort_by") ?? defaultSortBy,
                sort_dir: (sp.get("sort_dir") as "asc" | "desc") ?? defaultSortDir,
            }
            : { limit: defaultLimit, page: 1, sort_by: defaultSortBy, sort_dir: defaultSortDir };

        const filters = {} as TFilters;
        filterKeys.forEach((key) => {
            const raw = syncToUrl ? sp.get(String(key)) : null;
            (filters as Record<string, FilterValue>)[String(key)] =
                raw === null || raw === "" ? defaultFilters[key] : raw;
        });

        return { ...base, ...filters } as AdminListParams<TFilters>;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [params, setParamsState] = useState<AdminListParams<TFilters>>(() =>
        parseParams(initialSearchParams)
    );

    // ─── Search input với debounce ────────────────────────────────────────────────

    const [searchInput, setSearchInput] = useState(
        searchKey ? String(params[searchKey] ?? "") : ""
    );
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // ─── Build query string ───────────────────────────────────────────────────────

    const buildQueryString = useCallback(
        (next: AdminListParams<TFilters>) => {
            const p = new URLSearchParams();
            if (next.limit) p.set("limit", String(next.limit));
            if (next.page && next.page > 1) p.set("page", String(next.page));
            if (next.sort_by) p.set("sort_by", next.sort_by);
            if (next.sort_dir) p.set("sort_dir", next.sort_dir);
            filterKeys.forEach((key) => {
                const value = (next as Record<string, FilterValue>)[String(key)];
                if (value !== undefined && value !== "") p.set(String(key), String(value));
            });
            const qs = p.toString();
            return qs ? `?${qs}` : "";
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        []
    );

    // ─── Sync params → URL (replaceState) ────────────────────────────────────────
    //
    // Dùng replaceState thay vì pushState để Back button của browser nhảy ra
    // trang trước (không restore filter). Không cần popstate listener vì không
    // có filter history nào để restore.

    const isFirstSync = useRef(true);
    useEffect(() => {
        if (!syncToUrl || typeof window === "undefined") return;
        if (isFirstSync.current) {
            isFirstSync.current = false;
            return;
        }
        const qs = buildQueryString(params);
        window.history.replaceState(null, "", qs || window.location.pathname);
    }, [params, syncToUrl]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Core update ─────────────────────────────────────────────────────────────

    const update = useCallback(
        (patch: Partial<AdminListParams<TFilters>>, opts: { resetPage?: boolean } = {}) => {
            setParamsState((prev) => ({
                ...prev,
                ...patch,
                page: patch.page ?? (opts.resetPage !== false ? 1 : prev.page),
            } as AdminListParams<TFilters>));
        },
        []
    );

    /** Apply nhiều field cùng lúc trong 1 setState → 1 lần fetch. */
    const updateMany = useCallback(
        (patch: Partial<AdminListParams<TFilters>>) => update(patch),
        [update]
    );

    // ─── Debounce search input ────────────────────────────────────────────────────

    useEffect(() => {
        if (!searchKey) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            if (searchInput !== String(params[searchKey] ?? "")) {
                update({ [searchKey]: searchInput } as Partial<AdminListParams<TFilters>>);
            }
        }, DEBOUNCE_MS);
        return () => {
            if (debounceRef.current) clearTimeout(debounceRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchInput]);

    // ─── Convenience setters ──────────────────────────────────────────────────────

    const setPage = useCallback(
        (page: number) =>
            update({ page } as Partial<AdminListParams<TFilters>>, { resetPage: false }),
        [update]
    );

    const setLimit = useCallback(
        (limit: number) => update({ limit } as Partial<AdminListParams<TFilters>>),
        [update]
    );

    const setSort = useCallback(
        (sort_by: string, sort_dir: "asc" | "desc") =>
            update({ sort_by, sort_dir } as Partial<AdminListParams<TFilters>>, { resetPage: false }),
        [update]
    );

    const setFilter = useCallback(
        <K extends keyof TFilters>(key: K, value: TFilters[K]) =>
            update({ [key]: value } as unknown as Partial<AdminListParams<TFilters>>),
        [update]
    );

    const reset = useCallback(() => {
        if (searchKey) setSearchInput("");
        setParamsState({
            limit: defaultLimit,
            page: 1,
            sort_by: defaultSortBy,
            sort_dir: defaultSortDir,
            ...defaultFilters,
        } as AdminListParams<TFilters>);
    }, [defaultLimit, defaultSortBy, defaultSortDir, defaultFilters, searchKey]);

    return {
        params,
        searchInput,
        setSearchInput,
        setPage,
        setLimit,
        setSort,
        setFilter,
        updateMany,
        reset,
    };
}

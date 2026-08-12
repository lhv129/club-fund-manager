"use client";

import { useTranslations } from "next-intl";
import {
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
} from "react";

export interface PaginationProps {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange?: (limit: number) => void;
    limitOptions?: number[];
    className?: string;
}

type PageItem =
    | {
        type: "page";
        value: number;
    }
    | {
        type: "ellipsis";
        side: "left" | "right";
        pages: number[];
    };

function getPageItems(
    current: number,
    total: number,
): PageItem[] {
    if (total <= 7) {
        return Array.from(
            { length: total },
            (_, index) => ({
                type: "page" as const,
                value: index + 1,
            }),
        );
    }

    if (current <= 4) {
        return [
            {
                type: "page",
                value: 1,
            },
            {
                type: "page",
                value: 2,
            },
            {
                type: "page",
                value: 3,
            },
            {
                type: "page",
                value: 4,
            },
            {
                type: "ellipsis",
                side: "right",
                pages: Array.from(
                    {
                        length: total - 6,
                    },
                    (_, index) => index + 5,
                ),
            },
            {
                type: "page",
                value: total - 1,
            },
            {
                type: "page",
                value: total,
            },
        ];
    }

    if (current >= total - 3) {
        return [
            {
                type: "page",
                value: 1,
            },
            {
                type: "page",
                value: 2,
            },
            {
                type: "ellipsis",
                side: "left",
                pages: Array.from(
                    {
                        length: total - 6,
                    },
                    (_, index) => index + 3,
                ),
            },
            {
                type: "page",
                value: total - 3,
            },
            {
                type: "page",
                value: total - 2,
            },
            {
                type: "page",
                value: total - 1,
            },
            {
                type: "page",
                value: total,
            },
        ];
    }

    return [
        {
            type: "page",
            value: 1,
        },
        {
            type: "ellipsis",
            side: "left",
            pages: Array.from(
                {
                    length: current - 3,
                },
                (_, index) => index + 2,
            ),
        },
        {
            type: "page",
            value: current - 1,
        },
        {
            type: "page",
            value: current,
        },
        {
            type: "page",
            value: current + 1,
        },
        {
            type: "ellipsis",
            side: "right",
            pages: Array.from(
                {
                    length: total - current - 2,
                },
                (_, index) => current + 2 + index,
            ),
        },
        {
            type: "page",
            value: total,
        },
    ];
}

function PageSelect({
    pages,
    currentPage,
    onChange,
    align = "center",
    label,
}: {
    pages: number[];
    currentPage: number;
    onChange: (page: number) => void;
    align?: "left" | "center" | "right";
    label: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClickOutside = (
            event: MouseEvent,
        ) => {
            if (
                ref.current &&
                !ref.current.contains(
                    event.target as Node,
                )
            ) {
                setOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside,
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside,
            );
        };
    }, [open]);

    return (
        <div
            ref={ref}
            className="relative shrink-0"
        >
            <button
                type="button"
                aria-label={label}
                aria-expanded={open}
                onClick={() =>
                    setOpen((value) => !value)
                }
                className="
                    inline-flex
                    h-8
                    min-w-8
                    items-center
                    justify-center
                    rounded-lg
                    px-1.5
                    text-[10px]
                    font-medium
                    text-foreground-muted
                    transition-colors
                    hover:bg-background-subtle
                    hover:text-foreground
                    sm:px-2
                    sm:text-[11px]
                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-primary/30
                "
            >
                <span className="-mt-1 tracking-widest">
                    ...
                </span>
            </button>

            {open && (
                <div
                    className={`
                        absolute
                        top-full
                        z-50
                        mt-2
                        w-[min(11rem,calc(100vw-2rem))]
                        overflow-hidden
                        rounded-xl
                        border
                        border-border
                        bg-background
                        shadow-lg
                        shadow-foreground/10
                        sm:w-44
                        ${align === "left"
                            ? "left-0"
                            : align === "right"
                                ? "right-0"
                                : "left-1/2 -translate-x-1/2"
                        }
                    `}
                >
                    <div className="max-h-56 overflow-y-auto py-1 sm:max-h-64">
                        {pages.map((page) => {
                            const selected =
                                page === currentPage;

                            return (
                                <button
                                    key={page}
                                    type="button"
                                    onClick={() => {
                                        onChange(page);
                                        setOpen(false);
                                    }}
                                    className="
                                        flex
                                        min-h-9
                                        w-full
                                        items-center
                                        gap-2
                                        px-3
                                        py-2
                                        text-left
                                        text-[11px]
                                        text-foreground
                                        transition-colors
                                        hover:bg-background-subtle
                                        hover:text-primary
                                        sm:py-2.5
                                        sm:text-[12px]
                                    "
                                >
                                    <span className="
                                        flex h-4 w-4
                                        shrink-0
                                        items-center
                                        justify-center
                                    ">
                                        {selected && (
                                            <Check className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
                                        )}
                                    </span>

                                    <span
                                        className={
                                            selected
                                                ? "font-semibold text-primary"
                                                : "font-normal"
                                        }
                                    >
                                        {page}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export function Pagination({
    page,
    limit,
    total,
    onPageChange,
    onLimitChange,
    limitOptions = [
        10,
        20,
        50,
        100,
    ],
    className = "",
}: PaginationProps) {
    const t = useTranslations("common");

    const totalPages = Math.max(
        1,
        Math.ceil(total / limit),
    );

    const from =
        total === 0
            ? 0
            : (page - 1) * limit + 1;

    const to = Math.min(
        page * limit,
        total,
    );

    const pageItems = getPageItems(
        page,
        totalPages,
    );

    const getPageSelectLabel = (
        side: "left" | "right",
    ) =>
        side === "left"
            ? t("previousPages")
            : t("morePages");

    return (
        <div
            className={`
                flex
                w-full
                flex-col
                gap-3
                rounded-b-2xl
                border
                border-t-0
                border-border
                bg-background
                px-3
                py-3
                sm:px-4
                sm:py-3
                md:px-5
                lg:flex-row
                lg:items-center
                lg:justify-between
                ${className}
            `}
        >
            {/* Result count */}
            <div
                className="
                    flex
                    min-w-0
                    items-center
                    justify-center
                    text-[10px]
                    font-medium
                    text-foreground-muted
                    sm:justify-start
                    sm:text-[11px]
                    lg:shrink-0
                "
            >
                <span className="truncate">
                    {total === 0
                        ? t("noResults")
                        : t("showingResults", {
                            from,
                            to,
                            total,
                        })}
                </span>
            </div>

            {/* Controls */}
            <div
                className="
                    flex
                    w-full
                    min-w-0
                    flex-col
                    items-center
                    gap-2
                    sm:flex-row
                    sm:justify-end
                    sm:gap-2
                    md:gap-3
                    lg:w-auto
                    lg:shrink-0
                "
            >
                {/* Pagination */}
                <div
                    className="
                        flex
                        min-w-0
                        max-w-full
                        items-center
                        justify-center
                        gap-0.5
                        sm:gap-1
                    "
                >
                    {/* Previous */}
                    <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() =>
                            onPageChange(page - 1)
                        }
                        aria-label={t("previous")}
                        className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            text-foreground-muted
                            transition-colors
                            hover:bg-background-subtle
                            hover:text-foreground
                            disabled:pointer-events-none
                            disabled:opacity-40
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-primary/30
                        "
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>

                    {/* Pages */}
                    <div
                        className="
                            flex
                            min-w-0
                            items-center
                            gap-0.5
                            overflow-x-auto
                            scrollbar-none
                        "
                    >
                        {pageItems.map(
                            (item, index) => {
                                if (
                                    item.type ===
                                    "ellipsis"
                                ) {
                                    return (
                                        <PageSelect
                                            key={`ellipsis-${item.side}-${index}`}
                                            pages={item.pages}
                                            currentPage={page}
                                            onChange={
                                                onPageChange
                                            }
                                            align={
                                                item.side ===
                                                    "left"
                                                    ? "left"
                                                    : "right"
                                            }
                                            label={getPageSelectLabel(
                                                item.side,
                                            )}
                                        />
                                    );
                                }

                                const active =
                                    item.value ===
                                    page;

                                return (
                                    <button
                                        key={
                                            item.value
                                        }
                                        type="button"
                                        onClick={() =>
                                            onPageChange(
                                                item.value,
                                            )
                                        }
                                        aria-current={
                                            active
                                                ? "page"
                                                : undefined
                                        }
                                        className={`
                                            flex
                                            h-8
                                            min-w-8
                                            shrink-0
                                            items-center
                                            justify-center
                                            rounded-lg
                                            px-1.5
                                            text-[10px]
                                            font-medium
                                            tabular-nums
                                            transition-all
                                            duration-150
                                            active:scale-95
                                            sm:px-2
                                            sm:text-[11px]
                                            focus-visible:outline-none
                                            focus-visible:ring-2
                                            focus-visible:ring-primary/30
                                            ${active
                                                ? `
                                                        bg-primary-50
                                                        font-semibold
                                                        text-primary-700
                                                    `
                                                : `
                                                        text-foreground
                                                        hover:bg-background-subtle
                                                    `
                                            }
                                        `}
                                    >
                                        {item.value}
                                    </button>
                                );
                            },
                        )}
                    </div>

                    {/* Next */}
                    <button
                        type="button"
                        disabled={
                            page >= totalPages
                        }
                        onClick={() =>
                            onPageChange(page + 1)
                        }
                        aria-label={t("next")}
                        className="
                            flex
                            h-8
                            w-8
                            shrink-0
                            items-center
                            justify-center
                            rounded-lg
                            text-foreground-muted
                            transition-colors
                            hover:bg-background-subtle
                            hover:text-foreground
                            disabled:pointer-events-none
                            disabled:opacity-40
                            focus-visible:outline-none
                            focus-visible:ring-2
                            focus-visible:ring-primary/30
                        "
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>

                {/* Items per page */}
                {onLimitChange && (
                    <PaginationLimitSelect
                        value={limit}
                        options={limitOptions}
                        onChange={onLimitChange}
                        label={t("itemsPerPage")}
                    />
                )}
            </div>
        </div>
    );
}

function PaginationLimitSelect({
    value,
    options,
    onChange,
    label,
}: {
    value: number;
    options: number[];
    onChange: (value: number) => void;
    label: string;
}) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        const handleClickOutside = (
            event: MouseEvent,
        ) => {
            if (
                ref.current &&
                !ref.current.contains(
                    event.target as Node,
                )
            ) {
                setOpen(false);
            }
        };

        document.addEventListener(
            "mousedown",
            handleClickOutside,
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside,
            );
        };
    }, [open]);

    return (
        <div
            ref={ref}
            className="
                relative
                w-full
                shrink-0
                sm:w-auto
            "
        >
            <button
                type="button"
                aria-label={label}
                aria-expanded={open}
                onClick={() =>
                    setOpen((value) => !value)
                }
                className="
                inline-flex h-8 w-full items-center justify-center gap-2 rounded-xl border border-border px-3 text-[10px] font-normal text-foreground transition-colors hover:border-primary/40 hover:bg-background-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 sm:w-auto sm:justify-start sm:text-[11px]
            "
            >
                <span className="truncate">
                    {label}: {value}
                </span>

                <ChevronDown
                    className={`
                        h-3.5
                        w-3.5
                        shrink-0
                        text-foreground-muted
                        transition-transform
                        ${open
                            ? "rotate-180"
                            : ""
                        }
                    `}
                />
            </button>

            {open && (
                <div
                    className="
                        absolute
                        bottom-full
                        right-0
                        z-50
                        mb-2
                        w-full
                        min-w-44
                        overflow-hidden
                        rounded-xl
                        border
                        border-border
                        bg-background
                        shadow-lg
                        shadow-foreground/10
                        sm:w-auto
                    "
                >
                    <div className="py-1">
                        {options.map((option) => {
                            const selected =
                                option === value;

                            return (
                                <button
                                    key={option}
                                    type="button"
                                    onClick={() => {
                                        onChange(option);
                                        setOpen(false);
                                    }}
                                    className="
                                        flex
                                        min-h-9
                                        w-full
                                        items-center
                                        gap-2
                                        px-3
                                        py-2.5
                                        text-left
                                        text-[11px]
                                        text-foreground
                                        transition-colors
                                        hover:bg-background-subtle
                                        hover:text-primary
                                        sm:text-[12px]
                                    "
                                >
                                    <span
                                        className="
                                            flex
                                            h-4
                                            w-4
                                            shrink-0
                                            items-center
                                            justify-center
                                        "
                                    >
                                        {selected && (
                                            <Check className="h-4 w-4 text-primary" />
                                        )}
                                    </span>

                                    <span
                                        className={
                                            selected
                                                ? "font-semibold text-primary"
                                                : ""
                                        }
                                    >
                                        {label}:{" "}
                                        {option}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
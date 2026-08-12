"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Plus, SearchX } from "lucide-react";

export interface ColumnDef<T> {
    key: string;
    label: string;
    className?: string;
    render?: (
        row: T,
        index: number,
    ) => ReactNode;
    renderActions?: (
        row: T,
    ) => ReactNode;
}

export interface TableProps<T extends object> {
    columns: ColumnDef<T>[];
    data: T[];

    /**
     * Dùng cho lần loading đầu tiên,
     * khi chưa có data.
     */
    loading?: boolean;

    /**
     * Dùng khi đổi filter, sort, pagination.
     * Data cũ vẫn được giữ lại và hiển thị overlay loading.
     */
    fetching?: boolean;

    onAdd?: () => void;
    renderActions?: (row: T) => ReactNode;
    addLabel?: string;
    emptyText?: string;
    title?: string;
    subtitle?: string;

    keyExtractor: (
        row: T,
    ) => string | number;

    showActions?: boolean;

    renderAddButton?: (
        button: ReactNode,
    ) => ReactNode;

    headerActions?: ReactNode;

    selectable?: boolean;
    selectedIds?: (string | number)[];
    onSelectionChange?: (
        ids: (string | number)[],
    ) => void;
}

interface SkeletonRowProps {
    cellCount: number;
}

function SkeletonRow({
    cellCount,
}: SkeletonRowProps) {
    return (
        <tr className="animate-pulse">
            {Array.from({
                length: cellCount,
            }).map((_, index) => (
                <td
                    key={index}
                    className="px-4 py-3.5"
                >
                    <div className="h-4 w-full rounded-md bg-background-muted" />
                </td>
            ))}
        </tr>
    );
}

export function Table<T extends object>({
    columns,
    data = [],
    loading = false,
    fetching = false,
    onAdd,
    renderActions,
    showActions = true,
    addLabel,
    emptyText,
    title,
    subtitle,
    keyExtractor,
    renderAddButton,
    headerActions,
    selectable = false,
    selectedIds = [],
    onSelectionChange,
}: TableProps<T>) {
    const t = useTranslations("common");

    const resolvedAddLabel =
        addLabel ?? t("add");

    const resolvedEmptyText =
        emptyText ?? t("noData");

    /**
     * Chỉ render skeleton khi:
     * - Đang loading
     * - Chưa có data
     *
     * Khi đổi filter mà vẫn có data cũ,
     * table cũ sẽ tiếp tục được giữ lại.
     */
    const showInitialSkeleton =
        loading && data.length === 0;

    const totalCellCount =
        columns.length +
        (selectable ? 1 : 0) +
        (showActions ? 1 : 0);

    const allSelected =
        data.length > 0 &&
        selectedIds.length === data.length &&
        data.every((row) =>
            selectedIds.includes(
                keyExtractor(row),
            ),
        );

    const toggleAll = () => {
        if (!onSelectionChange) {
            return;
        }

        if (allSelected) {
            onSelectionChange([]);
            return;
        }

        onSelectionChange(
            data.map((row) =>
                keyExtractor(row),
            ),
        );
    };

    const toggleOne = (
        id: string | number,
    ) => {
        if (!onSelectionChange) {
            return;
        }

        if (selectedIds.includes(id)) {
            onSelectionChange(
                selectedIds.filter(
                    (selectedId) =>
                        selectedId !== id,
                ),
            );
            return;
        }

        onSelectionChange([
            ...selectedIds,
            id,
        ]);
    };

    const showHeader = Boolean(
        title || onAdd || headerActions,
    );

    const addButton = (
        <button
            type="button"
            onClick={onAdd}
            className="
                inline-flex items-center gap-2
                rounded-xl
                bg-primary
                px-3.5 py-2
                text-sm font-medium
                text-primary-foreground
                shadow-sm shadow-primary/25
                transition-all duration-150
                hover:bg-primary-hover
                active:scale-[0.98]
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-primary/40
            "
        >
            <Plus className="h-4 w-4" />

            {resolvedAddLabel}
        </button>
    );

    return (
        <div
            className="
                overflow-hidden
                rounded-t-2xl
                rounded-b-none
                border
                border-b-0
                border-border
                bg-background
            "
        >
            {showHeader && (
                <div
                    className="
                        flex items-center
                        justify-between
                        border-b border-border
                        px-5 py-4
                    "
                >
                    {title ? (
                        <div>
                            <h3 className="font-semibold text-foreground">
                                {title}
                            </h3>

                            {subtitle && (
                                <p className="mt-0.5 text-sm text-foreground-muted">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    ) : (
                        <div />
                    )}

                    <div className="flex items-center gap-2">
                        {headerActions}

                        {onAdd &&
                            (renderAddButton ? (
                                renderAddButton(
                                    addButton,
                                )
                            ) : (
                                addButton
                            ))}
                    </div>
                </div>
            )}

            <div className="relative">
                <div
                    className="
                        table-scroll
                        overflow-x-auto
                        overflow-y-hidden
                    "
                >
                    <table
                        className="
                            min-w-full
                            text-sm
                            text-foreground
                        "
                    >
                        <thead>
                            <tr
                                className="
                                    border-b border-border
                                    bg-background-subtle/60
                                "
                            >
                                {selectable && (
                                    <th
                                        className="
                                            w-10
                                            py-3
                                            pl-4 pr-2
                                        "
                                    >
                                        <input
                                            type="checkbox"
                                            checked={
                                                allSelected
                                            }
                                            onChange={
                                                toggleAll
                                            }
                                            aria-label="Select all rows"
                                            className="
                                                h-4 w-4
                                                cursor-pointer
                                                rounded
                                                border-border-strong
                                                text-primary
                                                accent-primary
                                                focus:ring-primary/40
                                            "
                                        />
                                    </th>
                                )}

                                {columns.map(
                                    (column) => (
                                        <th
                                            key={
                                                column.key
                                            }
                                            className={`
                                                whitespace-nowrap
                                                px-4 py-3
                                                text-left
                                                text-[11px]
                                                font-semibold
                                                uppercase
                                                tracking-wider
                                                text-foreground-muted
                                                ${column.className ??
                                                ""
                                                }
                                            `}
                                        >
                                            {
                                                column.label
                                            }
                                        </th>
                                    ),
                                )}

                                {showActions && (
                                    <th
                                        className="
                                            whitespace-nowrap
                                            px-4 py-3
                                            text-right
                                            text-[11px]
                                            font-semibold
                                            uppercase
                                            tracking-wider
                                            text-foreground-muted
                                        "
                                    >
                                        {t("actions")}
                                    </th>
                                )}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-border">
                            {showInitialSkeleton ? (
                                Array.from({
                                    length: 5,
                                }).map(
                                    (_, index) => (
                                        <SkeletonRow
                                            key={
                                                index
                                            }
                                            cellCount={
                                                totalCellCount
                                            }
                                        />
                                    ),
                                )
                            ) : data.length === 0 ? (
                                <tr>
                                    <td
                                        colSpan={
                                            totalCellCount
                                        }
                                        className="
                                            py-16
                                            text-center
                                        "
                                    >
                                        <div
                                            className="
                                                mx-auto mb-3
                                                flex h-14 w-14
                                                items-center
                                                justify-center
                                                rounded-2xl
                                                bg-background-subtle
                                            "
                                        >
                                            <SearchX
                                                className="
                                                    h-6 w-6
                                                    text-foreground-muted
                                                    opacity-60
                                                "
                                            />
                                        </div>

                                        <p className="text-sm text-foreground-muted">
                                            {
                                                resolvedEmptyText
                                            }
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                data.map(
                                    (
                                        row,
                                        rowIndex,
                                    ) => {
                                        const rowId =
                                            keyExtractor(
                                                row,
                                            );

                                        const isChecked =
                                            selectedIds.includes(
                                                rowId,
                                            );

                                        return (
                                            <tr
                                                key={
                                                    rowId
                                                }
                                                onClick={
                                                    selectable
                                                        ? () =>
                                                            toggleOne(
                                                                rowId,
                                                            )
                                                        : undefined
                                                }
                                                className={`
                                                    transition-colors
                                                    duration-150
                                                    ${selectable
                                                        ? "cursor-pointer select-none"
                                                        : ""
                                                    }
                                                    ${isChecked
                                                        ? "bg-primary/5"
                                                        : "hover:bg-background-subtle/60"
                                                    }
                                                `}
                                            >
                                                {selectable && (
                                                    <td
                                                        className="
                                                            py-3.5
                                                            pl-4 pr-2
                                                        "
                                                        onClick={(
                                                            event,
                                                        ) =>
                                                            event.stopPropagation()
                                                        }
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={
                                                                isChecked
                                                            }
                                                            onChange={() =>
                                                                toggleOne(
                                                                    rowId,
                                                                )
                                                            }
                                                            aria-label={`Select row ${rowId}`}
                                                            className="
                                                                h-4 w-4
                                                                cursor-pointer
                                                                rounded
                                                                border-border-strong
                                                                text-primary
                                                                accent-primary
                                                                focus:ring-primary/40
                                                            "
                                                        />
                                                    </td>
                                                )}

                                                {columns.map(
                                                    (
                                                        column,
                                                    ) => (
                                                        <td
                                                            key={
                                                                column.key
                                                            }
                                                            className={`
                                                                px-4 py-3.5
                                                                text-foreground
                                                                ${column.className ??
                                                                ""
                                                                }
                                                            `}
                                                        >
                                                            {column.render
                                                                ? column.render(
                                                                    row,
                                                                    rowIndex,
                                                                )
                                                                : String(
                                                                    (
                                                                        row as Record<
                                                                            string,
                                                                            unknown
                                                                        >
                                                                    )[
                                                                    column.key
                                                                    ] ??
                                                                    "",
                                                                )}
                                                        </td>
                                                    ),
                                                )}

                                                {showActions && (
                                                    <td className="px-4 py-3.5">
                                                        <div
                                                            className="
                                                                flex
                                                                items-center
                                                                justify-end
                                                                gap-1.5
                                                            "
                                                        >
                                                            {renderActions &&
                                                                renderActions(
                                                                    row,
                                                                )}
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    },
                                )
                            )}
                        </tbody>
                    </table>
                </div>

                {fetching && !showInitialSkeleton && (
                    <div
                        className="
                        pointer-events-none
                        absolute inset-0 z-10
                        flex items-center
                        justify-center
                        bg-background/35
                        backdrop-blur-[1px]
                        "
                        aria-live="polite"
                        aria-busy="true"
                    >
                        <div
                            className="
                            flex items-center gap-2
                            rounded-xl
                            border border-border
                            bg-background/90
                            px-3 py-2
                            text-xs text-foreground-muted
                            shadow-sm
                            "
                        >
                            <span
                                className="
                                h-4 w-4
                                animate-spin
                                rounded-full
                                border-2
                                border-primary
                                border-t-transparent
                                "
                            />

                            <span>Đang tải...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
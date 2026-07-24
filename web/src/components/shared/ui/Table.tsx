"use client";

import { useTranslations } from "next-intl";
import { Plus, SearchX } from "lucide-react";

export interface ColumnDef<T> {
    key: string;
    label: string;
    className?: string;
    render?: (row: T, index: number) => React.ReactNode;
    renderActions?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
    columns: ColumnDef<T>[];
    data: T[];
    loading?: boolean;
    onAdd?: () => void;
    renderActions?: (row: T) => React.ReactNode;
    addLabel?: string;
    emptyText?: string;
    title?: string;
    subtitle?: string;
    keyExtractor: (row: T) => string | number;
    showActions?: boolean;
    renderAddButton?: (button: React.ReactNode) => React.ReactNode;
    headerActions?: React.ReactNode;
    selectable?: boolean;
    selectedIds?: (string | number)[];
    onSelectionChange?: (ids: (string | number)[]) => void;
}

function SkeletonRow({ cols }: { cols: number }) {
    return (
        <tr className="animate-pulse">
            {Array.from({ length: cols + 1 }).map((_, i) => (
                <td key={i} className="px-4 py-3.5">
                    <div className="h-4 bg-background-muted rounded-md w-full" />
                </td>
            ))}
        </tr>
    );
}

export function Table<T extends object>({
    columns,
    data = [],
    loading = false,
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

    const resolvedAddLabel = addLabel ?? t("add");
    const resolvedEmptyText = emptyText ?? t("noData");

    const allSelected = (data?.length ?? 0) > 0 && selectedIds.length === (data?.length ?? 0);

    const toggleAll = () => {
        if (!onSelectionChange) return;
        if (allSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(data.map((row) => keyExtractor(row)));
        }
    };

    const toggleOne = (id: string | number) => {
        if (!onSelectionChange) return;
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter((i) => i !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const showHeader = !!(title || onAdd || headerActions);

    const addButton = (
        <button
            onClick={onAdd}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary
                hover:bg-primary-hover text-primary-foreground text-sm font-medium
                shadow-sm shadow-primary/25 transition-all duration-150 active:scale-[0.98]
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
            <Plus className="w-4 h-4" />
            {resolvedAddLabel}
        </button>
    );

    return (
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">
            {showHeader && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    {title && (
                        <div>
                            <h3 className="font-semibold text-foreground">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-sm text-foreground-muted mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {headerActions}

                        {onAdd &&
                            (renderAddButton ? (
                                renderAddButton(addButton)
                            ) : (
                                addButton
                            ))}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-background-subtle/60">
                            {selectable && (
                                <th className="pl-4 pr-2 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-border-strong text-primary
                                            focus:ring-primary/40 cursor-pointer"
                                    />
                                </th>
                            )}

                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-[11px] font-semibold text-foreground-muted uppercase tracking-wider whitespace-nowrap ${col.className ?? ""}`}
                                >
                                    {col.label}
                                </th>
                            ))}

                            {showActions && (
                                <th className="px-4 py-3 text-right text-[11px] font-semibold text-foreground-muted uppercase tracking-wider whitespace-nowrap">
                                    {t("actions")}
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-border">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <SkeletonRow key={i} cols={columns.length} />
                            ))
                        ) : data.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={
                                        (showActions ? 1 : 0) +
                                        columns.length +
                                        (selectable ? 1 : 0)
                                    }
                                    className="text-center py-16"
                                >
                                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-background-subtle
                                        flex items-center justify-center">
                                        <SearchX className="w-6 h-6 text-foreground-muted opacity-60" />
                                    </div>
                                    <p className="text-sm text-foreground-muted">{resolvedEmptyText}</p>
                                </td>
                            </tr>
                        ) : (
                            data.map((row, rowIndex) => {
                                const rowId = keyExtractor(row);
                                const isChecked = selectedIds.includes(rowId);
                                return (
                                    <tr
                                        key={rowId}
                                        onClick={
                                            selectable
                                                ? () => toggleOne(rowId)
                                                : undefined
                                        }
                                        className={`transition-colors duration-150 ${selectable ? "cursor-pointer select-none" : ""} ${isChecked
                                            ? "bg-primary/5"
                                            : "hover:bg-background-subtle/60"
                                            }`}
                                    >
                                        {selectable && (
                                            <td
                                                className="pl-4 pr-2 py-3.5"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleOne(rowId)}
                                                    className="w-4 h-4 rounded border-border-strong text-primary
                                                        focus:ring-primary/40 cursor-pointer"
                                                />
                                            </td>
                                        )}

                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`px-4 py-3.5 text-foreground ${col.className ?? ""}`}
                                            >
                                                {col.render
                                                    ? col.render(row, rowIndex)
                                                    : String((row as any)[col.key] ?? "")}
                                            </td>
                                        ))}

                                        {showActions && (
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {renderActions && renderActions(row)}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

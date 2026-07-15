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
                    <div className="h-4 bg-gray-100 dark:bg-gray-800 rounded-md w-full" />
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

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden">
            {showHeader && (
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    {title && (
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                {title}
                            </h3>
                            {subtitle && (
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    )}

                    <div className="flex items-center gap-2">
                        {headerActions}

                        {onAdd &&
                            (renderAddButton ? (
                                renderAddButton(
                                    <button
                                        onClick={onAdd}
                                        className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                                    >
                                        <Plus className="w-4 h-4" />
                                        {resolvedAddLabel}
                                    </button>
                                )
                            ) : (
                                <button
                                    onClick={onAdd}
                                    className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                    {resolvedAddLabel}
                                </button>
                            ))}
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            {selectable && (
                                <th className="pl-4 pr-2 py-3 w-10">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleAll}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 cursor-pointer"
                                    />
                                </th>
                            )}

                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap ${col.className ?? ""}`}
                                >
                                    {col.label}
                                </th>
                            ))}

                            {showActions && (
                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
                                    {t("actions")}
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
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
                                    className="text-center py-16 text-gray-400 dark:text-gray-600"
                                >
                                    <SearchX className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">{resolvedEmptyText}</p>
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
                                        className={`transition-colors ${selectable ? "cursor-pointer select-none" : ""} ${isChecked
                                            ? "bg-indigo-50/60 dark:bg-indigo-900/15"
                                            : "hover:bg-gray-50 dark:hover:bg-gray-800/40"
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
                                                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 cursor-pointer"
                                                />
                                            </td>
                                        )}

                                        {columns.map((col) => (
                                            <td
                                                key={col.key}
                                                className={`px-4 py-3.5 text-gray-700 dark:text-gray-300 ${col.className ?? ""}`}
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

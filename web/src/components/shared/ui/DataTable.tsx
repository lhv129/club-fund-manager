"use client";

import type { TableProps } from "@/components/shared/ui/Table";
import { Table } from "@/components/shared/ui/Table";

import type { PaginationProps } from "@/components/shared/ui/Pagination";
import { Pagination } from "@/components/shared/ui/Pagination";

export interface DataTableProps<T extends object> {
    table: TableProps<T>;
    pagination: PaginationProps;
    className?: string;
}

export function DataTable<T extends object>({
    table,
    pagination,
    className = "",
}: DataTableProps<T>) {
    return (
        <div className={`w-full ${className}`}>
            <Table {...table} />

            <Pagination {...pagination} />
        </div>
    );
}
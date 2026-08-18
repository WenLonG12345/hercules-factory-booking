"use client";

import {
  type ColumnDef,
  createColumnHelper,
  createSortedRowModel,
  type RowData,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import { ChevronDown, ChevronsUpDown, ChevronUp } from "lucide-react";
import { Fragment, type ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  TableWrap,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

/**
 * One headless table for the whole admin. TanStack owns the row/header models,
 * this file owns the markup — the same stone shell every page used to hand-roll.
 *
 * Sorting is the only feature registered: nothing here paginates or filters
 * (the pages filter their own data before handing it over).
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
});

export type DataTableFeatures = typeof dataTableFeatures;

export type DataColumn<TData extends RowData> = ColumnDef<
  DataTableFeatures,
  TData,
  // biome-ignore lint/suspicious/noExplicitAny: cell values differ per column
  any
>;

/** `createColumnHelper` pre-bound to the features this table registers. */
export function columnHelper<TData extends RowData>() {
  return createColumnHelper<DataTableFeatures, TData>();
}

const EMPTY: never[] = [];

export type DataTableProps<TData extends RowData> = {
  columns: DataColumn<TData>[];
  data: TData[] | undefined;
  /** Stable row identity — keeps keys correct once rows are sorted. */
  getRowId?: (row: TData, index: number) => string;
  /** Shown in a full-width cell when there are no rows. */
  empty?: ReactNode;
  /** Let every column sort on header click unless it opts out. */
  sortable?: boolean;
  /** Drop the 760px floor — for the narrow tables that sit in a grid column. */
  dense?: boolean;
  className?: string;
  rowClassName?: (row: TData) => string | undefined;
  /** Full-width row rendered under its parent (inline edit forms). */
  renderSubRow?: (row: TData) => ReactNode;
  /** Raw `<tr>` content for the `<tfoot>` — totals rows carry their own spans. */
  footer?: ReactNode;
};

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  empty = "Nothing here yet.",
  sortable = false,
  dense = false,
  className,
  rowClassName,
  renderSubRow,
  footer,
}: DataTableProps<TData>) {
  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: data ?? EMPTY,
    getRowId,
    enableSorting: sortable,
  });

  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;

  return (
    <TableWrap className={className}>
      <Table className={cn(dense && "min-w-0")}>
        <TableHeader>
          {table.getHeaderGroups().map((group) => (
            <TableRow key={group.id}>
              {group.headers.map((header) => {
                const canSort = header.column.getCanSort();
                const sorted = header.column.getIsSorted();
                return (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder ? null : canSort ? (
                      <button
                        className="flex items-center gap-1 uppercase tracking-wide hover:text-stone-800"
                        onClick={header.column.getToggleSortingHandler()}
                        type="button"
                      >
                        <table.FlexRender header={header} />
                        {sorted === "asc" ? (
                          <ChevronUp className="size-3" />
                        ) : sorted === "desc" ? (
                          <ChevronDown className="size-3" />
                        ) : (
                          <ChevronsUpDown className="size-3 opacity-40" />
                        )}
                      </button>
                    ) : (
                      <table.FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount}>{empty}</TableCell>
            </TableRow>
          ) : (
            rows.map((row) => {
              const subRow = renderSubRow?.(row.original);
              return (
                <Fragment key={row.id}>
                  <TableRow className={rowClassName?.(row.original)}>
                    {row.getAllCells().map((cell) => (
                      <TableCell key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </TableCell>
                    ))}
                  </TableRow>
                  {subRow ? (
                    <TableRow>
                      <TableCell
                        className="bg-stone-50 py-4"
                        colSpan={columnCount}
                      >
                        {subRow}
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })
          )}
        </TableBody>
        {footer ? <TableFooter>{footer}</TableFooter> : null}
      </Table>
    </TableWrap>
  );
}

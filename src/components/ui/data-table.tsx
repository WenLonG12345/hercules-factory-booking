"use client";

import {
  type ColumnDef,
  createColumnHelper,
  createPaginatedRowModel,
  createSortedRowModel,
  type RowData,
  rowPaginationFeature,
  rowSortingFeature,
  tableFeatures,
  useTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  ChevronUp,
} from "lucide-react";
import { Fragment, type ReactNode, useState } from "react";
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
 * Sorting and pagination are the features registered: nothing here filters
 * (the pages filter their own data before handing it over). A table without a
 * `pageSize` keeps showing every row it is given.
 */
export const dataTableFeatures = tableFeatures({
  rowSortingFeature,
  sortedRowModel: createSortedRowModel(),
  rowPaginationFeature,
  paginatedRowModel: createPaginatedRowModel(),
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
  /** Column the table arrives sorted by — the header still re-sorts it. */
  defaultSort?: { id: string; desc?: boolean };
  /** Rows per page. Omitted means one page holding everything. */
  pageSize?: number;
  /** Controlled page, 0-based — pass both when the page lives in the URL. */
  pageIndex?: number;
  onPageChange?: (pageIndex: number) => void;
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
  defaultSort,
  pageSize,
  pageIndex: controlledPageIndex,
  onPageChange,
  dense = false,
  className,
  rowClassName,
  renderSubRow,
  footer,
}: DataTableProps<TData>) {
  const [ownPageIndex, setOwnPageIndex] = useState(0);
  const rowCount = data?.length ?? 0;
  const size = pageSize ?? Math.max(rowCount, 1);
  const lastPage = Math.max(0, Math.ceil(rowCount / size) - 1);
  // Filtering can strip the rows out from under the current page — land on the
  // last one that still has rows rather than on a blank table.
  const pageIndex = Math.min(controlledPageIndex ?? ownPageIndex, lastPage);
  const setPage = onPageChange ?? setOwnPageIndex;

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data: data ?? EMPTY,
    getRowId,
    enableSorting: sortable,
    initialState: defaultSort && {
      sorting: [{ id: defaultSort.id, desc: defaultSort.desc ?? false }],
    },
    // Off: pages hand over a freshly filtered array on every render, and
    // TanStack's auto-reset reads that as "the data changed, go to page 1" —
    // which snaps the page back the instant it is turned. Resetting the page
    // when a filter changes is the calling page's job (it owns the filter).
    autoResetPageIndex: false,
    state: { pagination: { pageIndex, pageSize: size } },
    onPaginationChange: (updater) =>
      setPage(
        (typeof updater === "function"
          ? updater({ pageIndex, pageSize: size })
          : updater
        ).pageIndex,
      ),
  });

  const rows = table.getRowModel().rows;
  const columnCount = table.getAllLeafColumns().length;
  const firstRow = pageIndex * size + 1;

  return (
    <>
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
      {pageSize && rowCount > pageSize ? (
        <div className="mt-3 flex items-center justify-between gap-3 text-sm text-stone-500">
          <p>
            {firstRow}–{Math.min(firstRow + size - 1, rowCount)} of {rowCount}
          </p>
          <div className="flex items-center gap-1">
            <button
              aria-label="Previous page"
              className="inline-flex size-8 items-center justify-center rounded-md border border-stone-200 text-stone-600 transition hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent"
              disabled={pageIndex === 0}
              onClick={() => setPage(pageIndex - 1)}
              type="button"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="px-2 tabular-nums">
              Page {pageIndex + 1} of {lastPage + 1}
            </span>
            <button
              aria-label="Next page"
              className="inline-flex size-8 items-center justify-center rounded-md border border-stone-200 text-stone-600 transition hover:bg-stone-100 disabled:opacity-40 disabled:hover:bg-transparent"
              disabled={pageIndex >= lastPage}
              onClick={() => setPage(pageIndex + 1)}
              type="button"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
